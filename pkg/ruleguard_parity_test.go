package pkg_test

import (
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"testing"
)

type matchBlock struct {
	startLine int
	endLine   int
	lines     []string
}

func TestRuleguardRecoverErrorBlocksIncludePanicAndFatal(t *testing.T) {
	blocks := loadRuleguardMatchBlocks(t)
	allMatcherLines := matcherLineSet(blocks)

	for _, block := range blocks {
		for _, line := range block.lines {
			trimmed := strings.TrimSpace(line)
			if !strings.HasPrefix(trimmed, "`") || !strings.Contains(trimmed, "recover()") || !strings.Contains(trimmed, "$logger.Error(") {
				continue
			}

			panicVariant := strings.Replace(trimmed, "$logger.Error(", "$logger.Panic(", 1)
			fatalVariant := strings.Replace(trimmed, "$logger.Error(", "$logger.Fatal(", 1)
			if _, ok := allMatcherLines[panicVariant]; !ok {
				t.Fatalf("recover matcher line at block line %d missing panic analog:\n%s", block.startLine, trimmed)
			}
			if _, ok := allMatcherLines[fatalVariant]; !ok {
				t.Fatalf("recover matcher line at block line %d missing fatal analog:\n%s", block.startLine, trimmed)
			}
		}
	}
}

func TestRuleguardRecoverLiteralErrorMatchersHavePanicAndFatalAnalogs(t *testing.T) {
	blocks := loadRuleguardMatchBlocks(t)
	literalKeys := []string{`"error"`, `"errorMessage"`, `"reason"`, `"panic"`, "`error`", "`errorMessage`", "`reason`", "`panic`"}

	for _, block := range blocks {
		blockText := strings.Join(block.lines, "\n")
		if !strings.Contains(blockText, "recover()") {
			continue
		}

		lineSet := make(map[string]struct{}, len(block.lines))
		for _, line := range block.lines {
			lineSet[strings.TrimSpace(line)] = struct{}{}
		}

		for _, line := range block.lines {
			trimmed := strings.TrimSpace(line)
			if !strings.HasPrefix(trimmed, "`") || !strings.Contains(trimmed, "$logger.Error(") {
				continue
			}

			hasLiteralKey := false
			for _, key := range literalKeys {
				if strings.Contains(trimmed, key) {
					hasLiteralKey = true
					break
				}
			}
			if !hasLiteralKey {
				continue
			}

			panicVariant := strings.Replace(trimmed, "$logger.Error(", "$logger.Panic(", 1)
			fatalVariant := strings.Replace(trimmed, "$logger.Error(", "$logger.Fatal(", 1)
			if _, ok := lineSet[panicVariant]; !ok {
				t.Fatalf("recover literal matcher at line %d missing panic analog:\n%s", block.startLine, trimmed)
			}
			if _, ok := lineSet[fatalVariant]; !ok {
				t.Fatalf("recover literal matcher at line %d missing fatal analog:\n%s", block.startLine, trimmed)
			}
		}
	}
}

func TestRuleguardRecoverPanicAndFatalMatchersStaySymmetric(t *testing.T) {
	blocks := loadRuleguardMatchBlocks(t)
	allMatcherLines := matcherLineSet(blocks)

	for _, block := range blocks {
		for _, line := range block.lines {
			trimmed := strings.TrimSpace(line)
			if !strings.HasPrefix(trimmed, "`") || !strings.Contains(trimmed, "recover()") {
				continue
			}

			if strings.Contains(trimmed, "$logger.Panic(") {
				fatalVariant := strings.Replace(trimmed, "$logger.Panic(", "$logger.Fatal(", 1)
				if _, ok := allMatcherLines[fatalVariant]; !ok {
					t.Fatalf("recover panic matcher at block line %d missing fatal analog:\n%s", block.startLine, trimmed)
				}
			}

			if strings.Contains(trimmed, "$logger.Fatal(") {
				panicVariant := strings.Replace(trimmed, "$logger.Fatal(", "$logger.Panic(", 1)
				if _, ok := allMatcherLines[panicVariant]; !ok {
					t.Fatalf("recover fatal matcher at block line %d missing panic analog:\n%s", block.startLine, trimmed)
				}
			}
		}
	}
}

func TestRuleguardRecoverVariableKeyMatchersUseFullPanicKeySet(t *testing.T) {
	content := loadRuleguardRulesContent(t)
	lines := strings.Split(content, "\n")
	blocks := loadRuleguardMatchBlocks(t)
	const requiredKeySet = "^[\\\"`](error|errorMessage|reason|panic)[\\\"`]$"

	for i, block := range blocks {
		blockText := strings.Join(block.lines, "\n")
		if !strings.Contains(blockText, "recover()") || !strings.Contains(blockText, "$key") {
			continue
		}

		postamble := blockPostambleText(lines, blocks, i)
		if !strings.Contains(postamble, `m["key"].Text.Matches(`) {
			t.Fatalf("recover matcher block at line %d uses $key but has no m[\"key\"].Text.Matches(...) guard", block.startLine)
		}

		if !strings.Contains(postamble, requiredKeySet) {
			t.Fatalf("recover matcher block at line %d uses $key but does not enforce %s", block.startLine, requiredKeySet)
		}
	}
}

func TestRuleguardRecoverVariableKeyMatchersReportPanicValueGuidance(t *testing.T) {
	content := loadRuleguardRulesContent(t)
	lines := strings.Split(content, "\n")
	blocks := loadRuleguardMatchBlocks(t)

	for i, block := range blocks {
		blockText := strings.Join(block.lines, "\n")
		if !strings.Contains(blockText, "recover()") || !strings.Contains(blockText, "$key") {
			continue
		}

		reportText := blockReportText(lines, blocks, i)
		if reportText == "" || !strings.Contains(reportText, "\"panicValue\"") {
			t.Fatalf("recover matcher block at line %d does not report canonical panicValue guidance", block.startLine)
		}
	}
}

func TestRuleguardRecoverForbiddenKeyMatchersReportPanicValueGuidance(t *testing.T) {
	content := loadRuleguardRulesContent(t)
	lines := strings.Split(content, "\n")
	blocks := loadRuleguardMatchBlocks(t)
	forbiddenKeys := []string{`"error"`, `"errorMessage"`, `"reason"`, `"panic"`, "`error`", "`errorMessage`", "`reason`", "`panic`"}

	for i, block := range blocks {
		blockText := strings.Join(block.lines, "\n")
		if !strings.Contains(blockText, "recover()") {
			continue
		}

		hasForbiddenKeyGuidanceTarget := strings.Contains(blockText, "(error|errorMessage|reason|panic)")
		if !hasForbiddenKeyGuidanceTarget {
			for _, key := range forbiddenKeys {
				if strings.Contains(blockText, key) {
					hasForbiddenKeyGuidanceTarget = true
					break
				}
			}
		}
		if !hasForbiddenKeyGuidanceTarget {
			continue
		}

		reportText := blockReportText(lines, blocks, i)
		if reportText == "" || !strings.Contains(reportText, "\"panicValue\"") {
			t.Fatalf("recover forbidden-key matcher block at line %d does not report canonical panicValue guidance", block.startLine)
		}
	}
}

func TestRuleguardRecoverVariableKeyMatcherReportsMentionAllForbiddenAliases(t *testing.T) {
	content := loadRuleguardRulesContent(t)
	lines := strings.Split(content, "\n")
	blocks := loadRuleguardMatchBlocks(t)
	requiredAliases := []string{`"error"`, `"errorMessage"`, `"reason"`, `"panic"`}

	for i, block := range blocks {
		blockText := strings.Join(block.lines, "\n")
		if !strings.Contains(blockText, "recover()") || !strings.Contains(blockText, "$key") {
			continue
		}

		reportText := blockReportText(lines, blocks, i)
		for _, alias := range requiredAliases {
			if !strings.Contains(reportText, alias) {
				t.Fatalf("recover $key matcher block at line %d report is missing alias %s", block.startLine, alias)
			}
		}
	}
}

func TestRuleguardRecoverLiteralKeyMatchersReportMentionMatchedAliases(t *testing.T) {
	content := loadRuleguardRulesContent(t)
	lines := strings.Split(content, "\n")
	blocks := loadRuleguardMatchBlocks(t)

	for i, block := range blocks {
		blockText := strings.Join(block.lines, "\n")
		if !strings.Contains(blockText, "recover()") || strings.Contains(blockText, "$key") {
			continue
		}

		aliases := recoverAliasMentionsInMatcherLines(block.lines)
		if len(aliases) == 0 {
			continue
		}

		reportText := blockReportText(lines, blocks, i)
		if reportText == "" || !strings.Contains(reportText, `"panicValue"`) {
			t.Fatalf("recover literal-key matcher block at line %d is missing panicValue guidance", block.startLine)
		}

		for alias := range aliases {
			if !strings.Contains(reportText, `"`+alias+`"`) {
				t.Fatalf("recover literal-key matcher block at line %d report is missing alias %q", block.startLine, alias)
			}
		}
	}
}

func TestRuleguardRecoverMatchersDoNotContainDuplicatePatternLines(t *testing.T) {
	blocks := loadRuleguardMatchBlocks(t)

	for _, block := range blocks {
		blockText := strings.Join(block.lines, "\n")
		if !strings.Contains(blockText, "recover()") {
			continue
		}

		seen := map[string]struct{}{}
		for _, line := range block.lines {
			trimmed := strings.TrimSpace(line)
			if !strings.HasPrefix(trimmed, "`") {
				continue
			}
			if _, ok := seen[trimmed]; ok {
				t.Fatalf("recover matcher block at line %d contains duplicate pattern line:\n%s", block.startLine, trimmed)
			}
			seen[trimmed] = struct{}{}
		}
	}
}

func TestRuleguardRecoverForbiddenKeyMatchersUseExplicitReplacementLanguage(t *testing.T) {
	content := loadRuleguardRulesContent(t)
	lines := strings.Split(content, "\n")
	blocks := loadRuleguardMatchBlocks(t)
	forbiddenKeys := []string{`"error"`, `"errorMessage"`, `"reason"`, `"panic"`, "`error`", "`errorMessage`", "`reason`", "`panic`", `(error|errorMessage|reason|panic)`}

	for i, block := range blocks {
		blockText := strings.Join(block.lines, "\n")
		if !strings.Contains(blockText, "recover()") {
			continue
		}

		hasForbiddenAlias := false
		for _, key := range forbiddenKeys {
			if strings.Contains(blockText, key) {
				hasForbiddenAlias = true
				break
			}
		}
		if !hasForbiddenAlias {
			continue
		}

		reportText := blockReportText(lines, blocks, i)
		if reportText == "" || !strings.Contains(reportText, `"panicValue"`) || !strings.Contains(reportText, "instead of") {
			t.Fatalf("recover forbidden-key matcher block at line %d must include explicit panicValue replacement guidance", block.startLine)
		}
	}
}

func TestRuleguardRecoverMatcherBlocksAlwaysReport(t *testing.T) {
	content := loadRuleguardRulesContent(t)
	lines := strings.Split(content, "\n")
	blocks := loadRuleguardMatchBlocks(t)

	for i, block := range blocks {
		blockText := strings.Join(block.lines, "\n")
		if !strings.Contains(blockText, "recover()") {
			continue
		}

		reportText := blockReportText(lines, blocks, i)
		if reportText == "" {
			t.Fatalf("recover matcher block at line %d has no Report(...) guidance", block.startLine)
		}
	}
}

func TestRuntimeRecoverBlocksDoNotLogForbiddenPanicAliases(t *testing.T) {
	fset := token.NewFileSet()
	violations := make([]string, 0, 8)
	forbiddenAliases := map[string]struct{}{
		"error":        {},
		"errorMessage": {},
		"reason":       {},
		"panic":        {},
	}
	logMethodNames := structuredLogMethodNames()

	err := filepath.WalkDir(".", func(path string, d os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.IsDir() {
			return nil
		}
		if strings.Contains(path, "/testdata/") {
			return nil
		}
		if !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") || strings.HasSuffix(path, "ruleguard.rules.go") {
			return nil
		}

		file, parseErr := parser.ParseFile(fset, path, nil, 0)
		if parseErr != nil {
			return parseErr
		}
		constValues := stringConstValueMap(file)
		constNameValues := constNameValueMap(constValues)

		forEachRecoverFunctionBody(file, func(body *ast.BlockStmt) {
			recoverDerived := recoverDerivedIdentifiers(body)
			localNames := declaredNamesInBody(body)
			inspectBodyWithoutNestedFuncLits(body, func(inner ast.Node) bool {
				call, ok := inner.(*ast.CallExpr)
				if !ok {
					return true
				}

				method, ok := selectorName(call.Fun)
				if !ok {
					return true
				}
				if _, ok := logMethodNames[method]; !ok {
					return true
				}

				for argIdx := 0; argIdx+1 < len(call.Args); argIdx++ {
					key, ok := keyValueFromExpr(call.Args[argIdx], constValues, constNameValues, localNames)
					if !ok {
						continue
					}
					if _, isForbidden := forbiddenAliases[key]; isForbidden {
						if !exprDependsOnRecover(call.Args[argIdx+1], recoverDerived) {
							continue
						}
						position := fset.Position(call.Args[argIdx].Pos())
						violations = append(violations, position.String()+": recover logging uses forbidden key alias "+strconv.Quote(key))
					}
				}

				return true
			})
		})

		return nil
	})
	if err != nil {
		t.Fatalf("scan runtime recover logging: %v", err)
	}
	if len(violations) > 0 {
		sort.Strings(violations)
		t.Fatalf("found recover logging forbidden key aliases:\n%s", strings.Join(violations, "\n"))
	}
}

func TestRuntimeRecoverDerivedValuesUsePanicValueKey(t *testing.T) {
	fset := token.NewFileSet()
	violationSet := map[string]struct{}{}
	logMethodNames := structuredLogMethodNames()

	err := filepath.WalkDir(".", func(path string, d os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.IsDir() {
			return nil
		}
		if strings.Contains(path, "/testdata/") {
			return nil
		}
		if !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") || strings.HasSuffix(path, "ruleguard.rules.go") {
			return nil
		}

		file, parseErr := parser.ParseFile(fset, path, nil, 0)
		if parseErr != nil {
			return parseErr
		}
		constValues := stringConstValueMap(file)
		constNameValues := constNameValueMap(constValues)

		forEachRecoverFunctionBody(file, func(body *ast.BlockStmt) {
			recoverDerived := recoverDerivedIdentifiers(body)
			localNames := declaredNamesInBody(body)
			badSpreadSlices := recoverDerivedSlicesWithAliasViolations(body, recoverDerived, constValues, constNameValues, localNames)
			inspectBodyWithoutNestedFuncLits(body, func(inner ast.Node) bool {
				call, ok := inner.(*ast.CallExpr)
				if !ok {
					return true
				}
				method, ok := selectorName(call.Fun)
				if !ok {
					return true
				}
				if _, ok := logMethodNames[method]; !ok {
					return true
				}

				for argIdx, arg := range call.Args {
					if spreadArg, ok := arg.(*ast.Ellipsis); ok {
						if spreadIdent, ok := spreadArg.Elt.(*ast.Ident); ok {
							if alias, found := badSpreadSlices[spreadIdent.Name]; found {
								position := fset.Position(spreadArg.Pos())
								violationSet[position.String()+": recover-derived spread args must use key \"panicValue\", found "+strconv.Quote(alias)] = struct{}{}
							}
						}
					}

					if !exprDependsOnRecover(arg, recoverDerived) {
						continue
					}
					if argIdx == 0 {
						continue
					}

					prevKey, ok := keyValueFromExpr(call.Args[argIdx-1], constValues, constNameValues, localNames)
					if !ok {
						continue
					}

					if prevKey != "panicValue" {
						position := fset.Position(call.Args[argIdx-1].Pos())
						violationSet[position.String()+": recover-derived value must use key \"panicValue\", found "+strconv.Quote(prevKey)] = struct{}{}
					}
				}

				return true
			})
		})

		return nil
	})
	if err != nil {
		t.Fatalf("scan runtime recover key usage: %v", err)
	}
	if len(violationSet) > 0 {
		violations := make([]string, 0, len(violationSet))
		for violation := range violationSet {
			violations = append(violations, violation)
		}
		sort.Strings(violations)
		t.Fatalf("found recover-derived runtime logging without panicValue key:\n%s", strings.Join(violations, "\n"))
	}
}

func TestStringConstValueMapResolvesInheritedAndAliasedConstants(t *testing.T) {
	const src = `package p

const (
	panicKey         = "panicValue"
	aliasPanicKey    = panicKey
	reasonKey        = "reason"
	inheritedReason
	aliasInherited   = inheritedReason
)

var _ = aliasPanicKey
`

	file, err := parser.ParseFile(token.NewFileSet(), "consts.go", src, 0)
	if err != nil {
		t.Fatalf("parse const sample: %v", err)
	}

	constValues := stringConstValueMap(file)
	constNameValues := constNameValueMap(constValues)
	localNames := map[string]struct{}{}
	assertConstValue := func(name string, expected string) {
		t.Helper()
		obj, ok := file.Scope.Objects[name]
		if !ok {
			t.Fatalf("missing const object %q", name)
		}
		got, ok := constValues[obj]
		if !ok {
			t.Fatalf("const %q not resolved in value map", name)
		}
		if got != expected {
			t.Fatalf("const %q resolved to %q, expected %q", name, got, expected)
		}
	}

	assertConstValue("panicKey", "panicValue")
	assertConstValue("aliasPanicKey", "panicValue")
	assertConstValue("reasonKey", "reason")
	assertConstValue("inheritedReason", "reason")
	assertConstValue("aliasInherited", "reason")

	var aliasExpr ast.Expr
	for _, decl := range file.Decls {
		genDecl, ok := decl.(*ast.GenDecl)
		if !ok || genDecl.Tok != token.VAR {
			continue
		}
		for _, spec := range genDecl.Specs {
			valueSpec, ok := spec.(*ast.ValueSpec)
			if !ok || len(valueSpec.Values) == 0 {
				continue
			}
			aliasExpr = valueSpec.Values[0]
		}
	}
	if aliasExpr == nil {
		t.Fatal("failed to locate alias const usage expression")
	}

	resolved, ok := keyValueFromExpr(aliasExpr, constValues, constNameValues, localNames)
	if !ok || resolved != "panicValue" {
		t.Fatalf("expected keyValueFromExpr to resolve alias const to panicValue, got %q (ok=%v)", resolved, ok)
	}
}

func TestStringConstValueMapSkipsNonStringConstants(t *testing.T) {
	const src = `package p

const (
	stringKey = "panicValue"
	intKey    = 42
	boolKey   = true
)

var (
	_ = stringKey
	_ = intKey
	_ = boolKey
)
`

	file, err := parser.ParseFile(token.NewFileSet(), "consts_nonstring.go", src, 0)
	if err != nil {
		t.Fatalf("parse const sample: %v", err)
	}

	constValues := stringConstValueMap(file)

	stringObj, ok := file.Scope.Objects["stringKey"]
	if !ok {
		t.Fatal("missing stringKey object")
	}
	if got, ok := constValues[stringObj]; !ok || got != "panicValue" {
		t.Fatalf("expected stringKey to resolve to panicValue, got %q (ok=%v)", got, ok)
	}

	intObj, ok := file.Scope.Objects["intKey"]
	if !ok {
		t.Fatal("missing intKey object")
	}
	if _, exists := constValues[intObj]; exists {
		t.Fatal("intKey should not be included in string const value map")
	}

	boolObj, ok := file.Scope.Objects["boolKey"]
	if !ok {
		t.Fatal("missing boolKey object")
	}
	if _, exists := constValues[boolObj]; exists {
		t.Fatal("boolKey should not be included in string const value map")
	}
}

func TestRecoverDerivedSlicesWithAliasViolationsTracksConstKeysAndAppendChains(t *testing.T) {
	const src = `package p

func f() {
	const badKey = "error"
	panicVal := recover()
	good := []any{"panicValue", panicVal}
	bad := []any{"ctx", 1, badKey, panicVal}
	badAppend := append(bad, "extra", 1)
	_ = good
	_ = bad
	_ = badAppend
}
`

	file, err := parser.ParseFile(token.NewFileSet(), "slices.go", src, 0)
	if err != nil {
		t.Fatalf("parse slice sample: %v", err)
	}

	var body *ast.BlockStmt
	for _, decl := range file.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if ok && fn.Name.Name == "f" {
			body = fn.Body
			break
		}
	}
	if body == nil {
		t.Fatal("failed to locate test function body")
	}

	constValues := stringConstValueMap(file)
	constNameValues := constNameValueMap(constValues)
	recoverDerived := recoverDerivedIdentifiers(body)
	localNames := declaredNamesInBody(body)
	violations := recoverDerivedSlicesWithAliasViolations(body, recoverDerived, constValues, constNameValues, localNames)

	if _, hasGood := violations["good"]; hasGood {
		t.Fatal("good slice should not be marked with alias violation")
	}
	if got, ok := violations["bad"]; !ok || got != "error" {
		t.Fatalf("bad slice violation = %q (ok=%v), expected \"error\"", got, ok)
	}
	if got, ok := violations["badAppend"]; !ok || got != "error" {
		t.Fatalf("badAppend violation = %q (ok=%v), expected inherited \"error\"", got, ok)
	}
}

func loadRuleguardMatchBlocks(t *testing.T) []matchBlock {
	t.Helper()

	content := loadRuleguardRulesContent(t)
	lines := strings.Split(content, "\n")
	blocks := make([]matchBlock, 0, 256)

	inBlock := false
	startLine := 0
	current := make([]string, 0, 64)

	for i, line := range lines {
		trimmed := strings.TrimSpace(line)

		if !inBlock && strings.HasPrefix(trimmed, "m.Match(") {
			inBlock = true
			startLine = i + 1
			current = current[:0]
			current = append(current, line)
			if strings.Contains(trimmed, ").") {
				copied := make([]string, len(current))
				copy(copied, current)
				blocks = append(blocks, matchBlock{
					startLine: startLine,
					endLine:   i + 1,
					lines:     copied,
				})
				inBlock = false
			}
			continue
		}

		if inBlock {
			current = append(current, line)
			if strings.HasPrefix(trimmed, ").") {
				copied := make([]string, len(current))
				copy(copied, current)
				blocks = append(blocks, matchBlock{
					startLine: startLine,
					endLine:   i + 1,
					lines:     copied,
				})
				inBlock = false
			}
		}
	}

	if inBlock {
		t.Fatalf("unterminated m.Match block starting at line %d", startLine)
	}

	if len(blocks) == 0 {
		t.Fatal("no m.Match blocks parsed from ruleguard.rules.go")
	}

	return blocks
}

func loadRuleguardRulesContent(t *testing.T) string {
	t.Helper()

	rulesPath := filepath.Join("ruleguard.rules.go")
	content, err := os.ReadFile(rulesPath)
	if err != nil {
		t.Fatalf("read %s: %v", rulesPath, err)
	}

	return string(content)
}

func blockPostambleText(lines []string, blocks []matchBlock, idx int) string {
	start := blocks[idx].endLine
	end := len(lines)
	if idx+1 < len(blocks) {
		end = blocks[idx+1].startLine - 1
	}

	return strings.Join(lines[start:end], "\n")
}

func blockReportText(lines []string, blocks []matchBlock, idx int) string {
	postamble := blockPostambleText(lines, blocks, idx)
	reportStart := strings.Index(postamble, "Report(")
	if reportStart == -1 {
		return ""
	}

	return postamble[reportStart:]
}

func matcherLineSet(blocks []matchBlock) map[string]struct{} {
	lineSet := make(map[string]struct{}, 4096)
	for _, block := range blocks {
		for _, line := range block.lines {
			trimmed := strings.TrimSpace(line)
			if strings.HasPrefix(trimmed, "`") {
				lineSet[trimmed] = struct{}{}
			}
		}
	}

	return lineSet
}

func recoverAliasMentionsInMatcherLines(lines []string) map[string]struct{} {
	aliases := map[string]struct{}{}

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if !strings.HasPrefix(trimmed, "`") || !strings.Contains(trimmed, "recover()") {
			continue
		}

		if strings.Contains(trimmed, `"error"`) || strings.Contains(trimmed, "`error`") {
			aliases["error"] = struct{}{}
		}
		if strings.Contains(trimmed, `"errorMessage"`) || strings.Contains(trimmed, "`errorMessage`") {
			aliases["errorMessage"] = struct{}{}
		}
		if strings.Contains(trimmed, `"reason"`) || strings.Contains(trimmed, "`reason`") {
			aliases["reason"] = struct{}{}
		}
		if strings.Contains(trimmed, `"panic"`) || strings.Contains(trimmed, "`panic`") {
			aliases["panic"] = struct{}{}
		}
	}

	return aliases
}

func blockContainsRecover(body *ast.BlockStmt) bool {
	found := false
	inspectBodyWithoutNestedFuncLits(body, func(node ast.Node) bool {
		call, ok := node.(*ast.CallExpr)
		if !ok {
			return true
		}
		ident, ok := call.Fun.(*ast.Ident)
		if ok && ident.Name == "recover" {
			found = true
			return false
		}
		return true
	})
	return found
}

func selectorName(expr ast.Expr) (string, bool) {
	sel, ok := expr.(*ast.SelectorExpr)
	if !ok {
		return "", false
	}
	return sel.Sel.Name, true
}

func structuredLogMethodNames() map[string]struct{} {
	return map[string]struct{}{
		"Debug": {}, "Info": {}, "Warn": {}, "Error": {}, "Panic": {}, "Fatal": {},
		"DebugCtx": {}, "InfoCtx": {}, "WarnCtx": {}, "ErrorCtx": {},
		"InfoContext": {}, "WarnContext": {}, "ErrorContext": {}, "DebugContext": {},
		"Log": {}, "InfoS": {}, "ErrorS": {},
		"New": {}, "With": {}, "Group": {},
	}
}

type recoverDerivedSet struct {
	objects map[*ast.Object]struct{}
}

func recoverDerivedSlicesWithAliasViolations(
	body *ast.BlockStmt,
	recoverDerived recoverDerivedSet,
	constValues map[*ast.Object]string,
	constNameValues map[string]string,
	localNames map[string]struct{},
) map[string]string {
	badSlices := map[string]string{}

	recordVar := func(name string, rhs ast.Expr) {
		if name == "" || rhs == nil {
			return
		}

		if alias := recoverAliasViolationInSliceExpr(rhs, recoverDerived, badSlices, constValues, constNameValues, localNames); alias != "" {
			badSlices[name] = alias
		}
	}

	inspectBodyWithoutNestedFuncLits(body, func(node ast.Node) bool {
		switch n := node.(type) {
		case *ast.AssignStmt:
			if len(n.Lhs) != len(n.Rhs) {
				return true
			}
			for idx := range n.Lhs {
				lhsIdent, ok := n.Lhs[idx].(*ast.Ident)
				if !ok || lhsIdent.Name == "_" {
					continue
				}
				recordVar(lhsIdent.Name, n.Rhs[idx])
			}
		case *ast.ValueSpec:
			for idx, lhsIdent := range n.Names {
				if lhsIdent == nil || lhsIdent.Name == "_" {
					continue
				}
				if idx >= len(n.Values) {
					continue
				}
				recordVar(lhsIdent.Name, n.Values[idx])
			}
		}
		return true
	})

	return badSlices
}

func recoverAliasViolationInSliceExpr(
	expr ast.Expr,
	recoverDerived recoverDerivedSet,
	badSlices map[string]string,
	constValues map[*ast.Object]string,
	constNameValues map[string]string,
	localNames map[string]struct{},
) string {
	switch n := expr.(type) {
	case *ast.Ident:
		return badSlices[n.Name]
	case *ast.CompositeLit:
		for idx := 1; idx < len(n.Elts); idx++ {
			if !exprDependsOnRecover(n.Elts[idx], recoverDerived) {
				continue
			}
			key, ok := keyValueFromExpr(n.Elts[idx-1], constValues, constNameValues, localNames)
			if ok && key != "panicValue" {
				return key
			}
		}
	case *ast.CallExpr:
		if funIdent, ok := n.Fun.(*ast.Ident); ok && funIdent.Name == "append" {
			if len(n.Args) > 0 {
				if baseIdent, ok := n.Args[0].(*ast.Ident); ok {
					if alias := badSlices[baseIdent.Name]; alias != "" {
						return alias
					}
				}
			}
			for idx := 2; idx < len(n.Args); idx++ {
				if !exprDependsOnRecover(n.Args[idx], recoverDerived) {
					continue
				}
				key, ok := keyValueFromExpr(n.Args[idx-1], constValues, constNameValues, localNames)
				if ok && key != "panicValue" {
					return key
				}
			}
		}
	}

	return ""
}

func keyValueFromExpr(expr ast.Expr, constValues map[*ast.Object]string, constNameValues map[string]string, localNames map[string]struct{}) (string, bool) {
	basic, ok := expr.(*ast.BasicLit)
	if ok && basic.Kind == token.STRING {
		key, err := strconv.Unquote(basic.Value)
		if err != nil {
			return "", false
		}
		return key, true
	}

	ident, ok := expr.(*ast.Ident)
	if ok && ident.Obj != nil {
		if key, exists := constValues[ident.Obj]; exists {
			return key, true
		}
	}
	if ok && ident.Obj == nil {
		if _, shadowed := localNames[ident.Name]; shadowed {
			return "", false
		}
		if key, exists := constNameValues[ident.Name]; exists {
			return key, true
		}
	}

	return "", false
}

func stringConstValueMap(file *ast.File) map[*ast.Object]string {
	exprByObject := map[*ast.Object]ast.Expr{}

	ast.Inspect(file, func(node ast.Node) bool {
		genDecl, ok := node.(*ast.GenDecl)
		if !ok || genDecl.Tok != token.CONST {
			return true
		}

		var inheritedValues []ast.Expr
		for _, spec := range genDecl.Specs {
			valueSpec, ok := spec.(*ast.ValueSpec)
			if !ok {
				continue
			}

			if len(valueSpec.Values) > 0 {
				inheritedValues = valueSpec.Values
			}
			if len(inheritedValues) == 0 {
				continue
			}

			for idx, name := range valueSpec.Names {
				if name == nil || name.Obj == nil {
					continue
				}

				expr, ok := constValueExprAtIndex(inheritedValues, idx)
				if !ok {
					continue
				}
				exprByObject[name.Obj] = expr
			}
		}

		return true
	})

	values := map[*ast.Object]string{}
	visiting := map[*ast.Object]bool{}
	var resolve func(obj *ast.Object) (string, bool)
	resolve = func(obj *ast.Object) (string, bool) {
		if obj == nil {
			return "", false
		}
		if val, ok := values[obj]; ok {
			return val, true
		}
		if visiting[obj] {
			return "", false
		}
		expr, ok := exprByObject[obj]
		if !ok {
			return "", false
		}

		visiting[obj] = true
		defer delete(visiting, obj)

		switch e := expr.(type) {
		case *ast.BasicLit:
			if e.Kind != token.STRING {
				return "", false
			}
			val, err := strconv.Unquote(e.Value)
			if err != nil {
				return "", false
			}
			values[obj] = val
			return val, true
		case *ast.Ident:
			resolved, ok := resolve(e.Obj)
			if !ok {
				return "", false
			}
			values[obj] = resolved
			return resolved, true
		}

		return "", false
	}

	for obj := range exprByObject {
		resolve(obj)
	}

	return values
}

func constNameValueMap(constValues map[*ast.Object]string) map[string]string {
	byName := map[string]string{}
	for obj, val := range constValues {
		if obj == nil {
			continue
		}
		byName[obj.Name] = val
	}
	return byName
}

func constValueExprAtIndex(values []ast.Expr, idx int) (ast.Expr, bool) {
	switch {
	case len(values) == 0:
		return nil, false
	case len(values) == 1:
		return values[0], true
	case idx < len(values):
		return values[idx], true
	default:
		return nil, false
	}
}

func declaredNamesInBody(body *ast.BlockStmt) map[string]struct{} {
	names := map[string]struct{}{}
	inspectBodyWithoutNestedFuncLits(body, func(node ast.Node) bool {
		switch n := node.(type) {
		case *ast.AssignStmt:
			if n.Tok != token.DEFINE {
				return true
			}
			for _, lhs := range n.Lhs {
				if ident, ok := lhs.(*ast.Ident); ok && ident.Name != "_" {
					names[ident.Name] = struct{}{}
				}
			}
		case *ast.GenDecl:
			if n.Tok != token.VAR {
				return true
			}
			for _, spec := range n.Specs {
				valueSpec, ok := spec.(*ast.ValueSpec)
				if !ok {
					continue
				}
				for _, ident := range valueSpec.Names {
					if ident != nil && ident.Name != "_" {
						names[ident.Name] = struct{}{}
					}
				}
			}
		case *ast.RangeStmt:
			if n.Tok != token.DEFINE {
				return true
			}
			if ident, ok := n.Key.(*ast.Ident); ok && ident.Name != "_" {
				names[ident.Name] = struct{}{}
			}
			if ident, ok := n.Value.(*ast.Ident); ok && ident.Name != "_" {
				names[ident.Name] = struct{}{}
			}
		}
		return true
	})
	return names
}

func recoverDerivedIdentifiers(body *ast.BlockStmt) recoverDerivedSet {
	derived := recoverDerivedSet{
		objects: map[*ast.Object]struct{}{},
	}

	recordAssign := func(assign *ast.AssignStmt) {
		for _, rhs := range assign.Rhs {
			if !exprDependsOnRecover(rhs, derived) {
				continue
			}
			for _, lhs := range assign.Lhs {
				if ident, ok := lhs.(*ast.Ident); ok && ident.Name != "_" {
					if ident.Obj != nil {
						derived.objects[ident.Obj] = struct{}{}
					}
				}
			}
			return
		}
	}

	inspectBodyWithoutNestedFuncLits(body, func(node ast.Node) bool {
		switch n := node.(type) {
		case *ast.AssignStmt:
			recordAssign(n)
		case *ast.IfStmt:
			if initAssign, ok := n.Init.(*ast.AssignStmt); ok {
				recordAssign(initAssign)
			}
		}
		return true
	})

	return derived
}

func exprDependsOnRecover(expr ast.Expr, derived recoverDerivedSet) bool {
	depends := false
	ast.Inspect(expr, func(node ast.Node) bool {
		switch n := node.(type) {
		case *ast.CallExpr:
			if ident, ok := n.Fun.(*ast.Ident); ok && ident.Name == "recover" {
				depends = true
				return false
			}
		case *ast.Ident:
			if n.Obj != nil {
				if _, ok := derived.objects[n.Obj]; ok {
					depends = true
					return false
				}
			}
		}
		return true
	})
	return depends
}

func forEachRecoverFunctionBody(file *ast.File, visit func(body *ast.BlockStmt)) {
	ast.Inspect(file, func(node ast.Node) bool {
		switch n := node.(type) {
		case *ast.FuncDecl:
			if n.Body != nil && blockContainsRecover(n.Body) {
				visit(n.Body)
			}
		case *ast.FuncLit:
			if n.Body != nil && blockContainsRecover(n.Body) {
				visit(n.Body)
			}
		}
		return true
	})
}

func inspectBodyWithoutNestedFuncLits(body *ast.BlockStmt, visit func(node ast.Node) bool) {
	for _, stmt := range body.List {
		ast.Inspect(stmt, func(node ast.Node) bool {
			if node == nil {
				return true
			}
			if _, ok := node.(*ast.FuncLit); ok {
				return false
			}
			return visit(node)
		})
	}
}
