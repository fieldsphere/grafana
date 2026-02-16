package pkg_test

import (
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
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

		ast.Inspect(file, func(node ast.Node) bool {
			fn, ok := node.(*ast.FuncLit)
			if !ok {
				return true
			}

			if !funcLitContainsRecover(fn) {
				return true
			}
			recoverDerived := recoverDerivedIdentifiers(fn)

			ast.Inspect(fn.Body, func(inner ast.Node) bool {
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
					basic, ok := arg.(*ast.BasicLit)
					if !ok || basic.Kind != token.STRING {
						continue
					}

					val, unquoteErr := strconv.Unquote(basic.Value)
					if unquoteErr != nil {
						continue
					}
					if _, isForbidden := forbiddenAliases[val]; isForbidden {
						if argIdx+1 >= len(call.Args) || !exprDependsOnRecover(call.Args[argIdx+1], recoverDerived) {
							continue
						}
						position := fset.Position(basic.Pos())
						violations = append(violations, position.String()+": recover logging uses forbidden key alias "+basic.Value)
					}
				}

				return true
			})
			return true
		})

		return nil
	})
	if err != nil {
		t.Fatalf("scan runtime recover logging: %v", err)
	}
	if len(violations) > 0 {
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

		ast.Inspect(file, func(node ast.Node) bool {
			fn, ok := node.(*ast.FuncLit)
			if !ok {
				return true
			}
			if !funcLitContainsRecover(fn) {
				return true
			}
			recoverDerived := recoverDerivedIdentifiers(fn)

			ast.Inspect(fn.Body, func(inner ast.Node) bool {
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
					if !exprDependsOnRecover(arg, recoverDerived) {
						continue
					}
					if argIdx == 0 {
						continue
					}

					prevLit, ok := call.Args[argIdx-1].(*ast.BasicLit)
					if !ok || prevLit.Kind != token.STRING {
						continue
					}

					prevKey, unquoteErr := strconv.Unquote(prevLit.Value)
					if unquoteErr != nil {
						continue
					}
					if prevKey != "panicValue" {
						position := fset.Position(prevLit.Pos())
						violationSet[position.String()+": recover-derived value must use key \"panicValue\", found "+prevLit.Value] = struct{}{}
					}
				}

				return true
			})

			return true
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
		t.Fatalf("found recover-derived runtime logging without panicValue key:\n%s", strings.Join(violations, "\n"))
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

func funcLitContainsRecover(fn *ast.FuncLit) bool {
	found := false
	ast.Inspect(fn.Body, func(node ast.Node) bool {
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
		"New": {}, "With": {},
	}
}

type recoverDerivedSet struct {
	objects map[*ast.Object]struct{}
}

func recoverDerivedIdentifiers(fn *ast.FuncLit) recoverDerivedSet {
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

	ast.Inspect(fn.Body, func(node ast.Node) bool {
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
