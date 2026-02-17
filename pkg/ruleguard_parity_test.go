package pkg_test

import (
	"errors"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
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

const errRuntimeFileWalkerVisitorNil = "runtime file walker visitor is nil"

var errRuntimeFileWalkerVisitor = errors.New(errRuntimeFileWalkerVisitorNil)

var printCallPattern = regexp.MustCompile(`\bfmt\.Print(f|ln)?\s*\(|\blog\.Print(f|ln)?\s*\(`)

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
	violationSet := map[string]struct{}{}
	forbiddenAliases := map[string]struct{}{
		"error":        {},
		"errorMessage": {},
		"reason":       {},
		"panic":        {},
	}
	logMethodNames := structuredLogMethodNames()

	err := walkRuntimeGoFiles(t, func(path string) error {
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

				if spreadExpr, ok := spreadArgExpr(call); ok {
					if alias := recoverAliasViolationInSliceExpr(spreadExpr, recoverDerived, badSpreadSlices, constValues, constNameValues, localNames); alias != "" {
						position := fset.Position(spreadExpr.Pos())
						violationSet[position.String()+": recover logging uses forbidden key alias "+strconv.Quote(alias)] = struct{}{}
					}
				}

				for argIdx, arg := range call.Args {
					if argIdx+1 >= len(call.Args) {
						continue
					}
					if isSpreadVariadicArg(call, argIdx+1) {
						continue
					}

					key, ok := keyValueFromExpr(arg, constValues, constNameValues, localNames)
					if !ok {
						continue
					}
					if _, isForbidden := forbiddenAliases[key]; isForbidden {
						if !exprDependsOnRecover(call.Args[argIdx+1], recoverDerived) {
							continue
						}
						position := fset.Position(call.Args[argIdx].Pos())
						violationSet[position.String()+": recover logging uses forbidden key alias "+strconv.Quote(key)] = struct{}{}
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
	if len(violationSet) > 0 {
		violations := make([]string, 0, len(violationSet))
		for violation := range violationSet {
			violations = append(violations, violation)
		}
		sort.Strings(violations)
		t.Fatalf("found recover logging forbidden key aliases:\n%s", strings.Join(violations, "\n"))
	}
}

func TestRuntimeRecoverDerivedValuesUsePanicValueKey(t *testing.T) {
	fset := token.NewFileSet()
	violationSet := map[string]struct{}{}
	logMethodNames := structuredLogMethodNames()

	err := walkRuntimeGoFiles(t, func(path string) error {
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

				if spreadExpr, ok := spreadArgExpr(call); ok {
					if alias := recoverAliasViolationInSliceExpr(spreadExpr, recoverDerived, badSpreadSlices, constValues, constNameValues, localNames); alias != "" {
						position := fset.Position(spreadExpr.Pos())
						violationSet[position.String()+": recover-derived spread args must use key \"panicValue\", found "+strconv.Quote(alias)] = struct{}{}
					}
				}

				for argIdx, arg := range call.Args {
					if isSpreadVariadicArg(call, argIdx) {
						continue
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

func TestRuntimeGoSourcesDoNotUsePrintCalls(t *testing.T) {
	violations := make([]string, 0, 4)
	err := walkRuntimeGoFiles(t, func(path string) error {
		content, readErr := os.ReadFile(path)
		if readErr != nil {
			return readErr
		}

		if printCallPattern.Match(content) {
			violations = append(violations, path)
		}
		return nil
	})
	if err != nil {
		t.Fatalf("scan runtime go sources for print calls: %v", err)
	}
	if len(violations) > 0 {
		sort.Strings(violations)
		t.Fatalf("runtime go sources contain disallowed fmt/log print calls:\n%s", strings.Join(violations, "\n"))
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

func TestKeyValueFromExprResolvesConstIdentifierByNameFallback(t *testing.T) {
	const src = `package p

const packageKey = "panicValue"

func f() {
	_ = packageKey
}
`

	file, err := parser.ParseFile(token.NewFileSet(), "key_expr.go", src, 0)
	if err != nil {
		t.Fatalf("parse source: %v", err)
	}

	constValues := stringConstValueMap(file)
	constNameValues := constNameValueMap(constValues)

	var body *ast.BlockStmt
	for _, decl := range file.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if ok && fn.Name.Name == "f" {
			body = fn.Body
			break
		}
	}
	if body == nil {
		t.Fatal("failed to find function body")
	}

	var identExpr ast.Expr
	inspectBodyWithoutNestedFuncLits(body, func(node ast.Node) bool {
		assign, ok := node.(*ast.AssignStmt)
		if !ok || len(assign.Rhs) == 0 {
			return true
		}
		identExpr = assign.Rhs[0]
		return false
	})
	if identExpr == nil {
		t.Fatal("failed to find identifier expression")
	}

	got, ok := keyValueFromExpr(identExpr, constValues, constNameValues, declaredNamesInBody(body))
	if !ok || got != "panicValue" {
		t.Fatalf("expected package const identifier to resolve to panicValue, got %q (ok=%v)", got, ok)
	}
}

func TestKeyValueFromExprSkipsShadowedConstNameFallback(t *testing.T) {
	const src = `package p

const packageKey = "panicValue"

func f() {
	packageKey := "shadowed"
	_ = packageKey
}
`

	file, err := parser.ParseFile(token.NewFileSet(), "key_expr_shadowed.go", src, 0)
	if err != nil {
		t.Fatalf("parse source: %v", err)
	}

	constValues := stringConstValueMap(file)
	constNameValues := constNameValueMap(constValues)

	var body *ast.BlockStmt
	for _, decl := range file.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if ok && fn.Name.Name == "f" {
			body = fn.Body
			break
		}
	}
	if body == nil {
		t.Fatal("failed to find function body")
	}

	var identExpr ast.Expr
	inspectBodyWithoutNestedFuncLits(body, func(node ast.Node) bool {
		assign, ok := node.(*ast.AssignStmt)
		if !ok || len(assign.Rhs) == 0 {
			return true
		}
		if ident, ok := assign.Lhs[0].(*ast.Ident); ok && ident.Name == "_" {
			identExpr = assign.Rhs[0]
			return false
		}
		return true
	})
	if identExpr == nil {
		t.Fatal("failed to find shadowed identifier expression")
	}

	if got, ok := keyValueFromExpr(identExpr, constValues, constNameValues, declaredNamesInBody(body)); ok {
		t.Fatalf("expected shadowed identifier to be ignored, got %q", got)
	}
}

func TestConstValueExprAtIndexBehavior(t *testing.T) {
	litA := &ast.BasicLit{Kind: token.STRING, Value: `"a"`}
	litB := &ast.BasicLit{Kind: token.STRING, Value: `"b"`}

	if expr, ok := constValueExprAtIndex(nil, 0); ok || expr != nil {
		t.Fatalf("expected no expression for empty values, got %v (ok=%v)", expr, ok)
	}

	if expr, ok := constValueExprAtIndex([]ast.Expr{litA}, 0); !ok || expr != litA {
		t.Fatalf("expected single-value index 0 to resolve first literal, got %v (ok=%v)", expr, ok)
	}
	if expr, ok := constValueExprAtIndex([]ast.Expr{litA}, 3); !ok || expr != litA {
		t.Fatalf("expected single-value fallback for high index, got %v (ok=%v)", expr, ok)
	}

	if expr, ok := constValueExprAtIndex([]ast.Expr{litA, litB}, 1); !ok || expr != litB {
		t.Fatalf("expected multi-value index 1 to resolve second literal, got %v (ok=%v)", expr, ok)
	}
	if expr, ok := constValueExprAtIndex([]ast.Expr{litA, litB}, 2); ok || expr != nil {
		t.Fatalf("expected out-of-range multi-value index to fail, got %v (ok=%v)", expr, ok)
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

func TestRecoverAliasViolationInSliceExprDetectsSpreadCompositeLiteral(t *testing.T) {
	const src = `package p

func f(logger interface{ Error(string, ...any) }) {
	panicVal := recover()
	logger.Error("msg", []any{"reason", panicVal}...)
}
`

	file, err := parser.ParseFile(token.NewFileSet(), "spread_literal.go", src, 0)
	if err != nil {
		t.Fatalf("parse source: %v", err)
	}

	var body *ast.BlockStmt
	var spreadExpr ast.Expr
	for _, decl := range file.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if !ok || fn.Name.Name != "f" {
			continue
		}
		body = fn.Body
		inspectBodyWithoutNestedFuncLits(body, func(node ast.Node) bool {
			call, ok := node.(*ast.CallExpr)
			if !ok {
				return true
			}
			if expr, ok := spreadArgExpr(call); ok {
				spreadExpr = expr
				return false
			}
			return true
		})
	}
	if body == nil || spreadExpr == nil {
		t.Fatal("failed to locate spread expression in parsed function")
	}

	constValues := stringConstValueMap(file)
	constNameValues := constNameValueMap(constValues)
	recoverDerived := recoverDerivedIdentifiers(body)
	localNames := declaredNamesInBody(body)

	alias := recoverAliasViolationInSliceExpr(spreadExpr, recoverDerived, map[string]string{}, constValues, constNameValues, localNames)
	if alias != "reason" {
		t.Fatalf("expected spread expression to resolve forbidden alias \"reason\", got %q", alias)
	}
}

func TestSpreadArgHelpersRespectCallEllipsis(t *testing.T) {
	const src = `package p

func f(logger interface{ Error(string, ...any) }, args []any) {
	logger.Error("msg", args...)
	logger.Error("msg", "panicValue", recover())
}
`

	file, err := parser.ParseFile(token.NewFileSet(), "spread_helper.go", src, 0)
	if err != nil {
		t.Fatalf("parse source: %v", err)
	}

	var calls []*ast.CallExpr
	ast.Inspect(file, func(node ast.Node) bool {
		call, ok := node.(*ast.CallExpr)
		if !ok {
			return true
		}
		if _, ok := selectorName(call.Fun); ok {
			calls = append(calls, call)
		}
		return true
	})

	if len(calls) != 2 {
		t.Fatalf("expected 2 logger calls, got %d", len(calls))
	}

	if _, ok := spreadArgExpr(calls[0]); !ok {
		t.Fatal("expected spreadArgExpr to detect variadic spread call")
	}
	if !isSpreadVariadicArg(calls[0], len(calls[0].Args)-1) {
		t.Fatal("expected last argument in spread call to be flagged as spread variadic argument")
	}
	if isSpreadVariadicArg(calls[0], 0) {
		t.Fatal("expected non-last argument in spread call not to be treated as spread variadic argument")
	}

	if _, ok := spreadArgExpr(calls[1]); ok {
		t.Fatal("expected spreadArgExpr to return false for non-spread call")
	}
	if isSpreadVariadicArg(calls[1], len(calls[1].Args)-1) {
		t.Fatal("expected non-spread call not to report any spread variadic argument")
	}
}

func TestRecoverAliasViolationInSliceExprSupportsParenthesizedSpreadExpr(t *testing.T) {
	const src = `package p

func f(logger interface{ Error(string, ...any) }) {
	panicVal := recover()
	logger.Error("msg", ([]any{"panic", panicVal})...)
}
`

	file, err := parser.ParseFile(token.NewFileSet(), "spread_paren.go", src, 0)
	if err != nil {
		t.Fatalf("parse source: %v", err)
	}

	var body *ast.BlockStmt
	var spreadExpr ast.Expr
	for _, decl := range file.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if !ok || fn.Name.Name != "f" {
			continue
		}
		body = fn.Body
		inspectBodyWithoutNestedFuncLits(body, func(node ast.Node) bool {
			call, ok := node.(*ast.CallExpr)
			if !ok {
				return true
			}
			if expr, ok := spreadArgExpr(call); ok {
				spreadExpr = expr
				return false
			}
			return true
		})
	}
	if body == nil || spreadExpr == nil {
		t.Fatal("failed to locate parenthesized spread expression")
	}

	constValues := stringConstValueMap(file)
	constNameValues := constNameValueMap(constValues)
	recoverDerived := recoverDerivedIdentifiers(body)
	localNames := declaredNamesInBody(body)

	alias := recoverAliasViolationInSliceExpr(spreadExpr, recoverDerived, map[string]string{}, constValues, constNameValues, localNames)
	if alias != "panic" {
		t.Fatalf("expected parenthesized spread alias to resolve forbidden key \"panic\", got %q", alias)
	}
}

func TestRecoverAliasViolationInSliceExprDetectsAppendSpreadSliceAlias(t *testing.T) {
	const src = `package p

func f(logger interface{ Error(string, ...any) }) {
	panicVal := recover()
	bad := []any{"reason", panicVal}
	args := []any{"ctx", 1}
	logger.Error("msg", append(args, bad...)...)
}
`

	file, err := parser.ParseFile(token.NewFileSet(), "spread_append_alias.go", src, 0)
	if err != nil {
		t.Fatalf("parse source: %v", err)
	}

	var body *ast.BlockStmt
	var spreadExpr ast.Expr
	for _, decl := range file.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if !ok || fn.Name.Name != "f" {
			continue
		}
		body = fn.Body
		inspectBodyWithoutNestedFuncLits(body, func(node ast.Node) bool {
			call, ok := node.(*ast.CallExpr)
			if !ok {
				return true
			}
			if expr, ok := spreadArgExpr(call); ok {
				spreadExpr = expr
				return false
			}
			return true
		})
	}
	if body == nil || spreadExpr == nil {
		t.Fatal("failed to locate append spread expression")
	}

	constValues := stringConstValueMap(file)
	constNameValues := constNameValueMap(constValues)
	recoverDerived := recoverDerivedIdentifiers(body)
	localNames := declaredNamesInBody(body)
	badSlices := recoverDerivedSlicesWithAliasViolations(body, recoverDerived, constValues, constNameValues, localNames)

	alias := recoverAliasViolationInSliceExpr(spreadExpr, recoverDerived, badSlices, constValues, constNameValues, localNames)
	if alias != "reason" {
		t.Fatalf("expected append spread alias to resolve forbidden key \"reason\", got %q", alias)
	}
}

func TestRecoverAliasViolationInSliceExprDetectsAppendSpreadSliceAliasWithPrefixArgs(t *testing.T) {
	const src = `package p

func f(logger interface{ Error(string, ...any) }) {
	panicVal := recover()
	bad := []any{"errorMessage", panicVal}
	args := []any{"ctx", 1}
	logger.Error("msg", append(args, "extra", bad...)...)
}
`

	file, err := parser.ParseFile(token.NewFileSet(), "spread_append_alias_prefix.go", src, 0)
	if err != nil {
		t.Fatalf("parse source: %v", err)
	}

	var body *ast.BlockStmt
	var spreadExpr ast.Expr
	for _, decl := range file.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if !ok || fn.Name.Name != "f" {
			continue
		}
		body = fn.Body
		inspectBodyWithoutNestedFuncLits(body, func(node ast.Node) bool {
			call, ok := node.(*ast.CallExpr)
			if !ok {
				return true
			}
			if expr, ok := spreadArgExpr(call); ok {
				spreadExpr = expr
				return false
			}
			return true
		})
	}
	if body == nil || spreadExpr == nil {
		t.Fatal("failed to locate append spread expression with prefix args")
	}

	constValues := stringConstValueMap(file)
	constNameValues := constNameValueMap(constValues)
	recoverDerived := recoverDerivedIdentifiers(body)
	localNames := declaredNamesInBody(body)
	badSlices := recoverDerivedSlicesWithAliasViolations(body, recoverDerived, constValues, constNameValues, localNames)

	alias := recoverAliasViolationInSliceExpr(spreadExpr, recoverDerived, badSlices, constValues, constNameValues, localNames)
	if alias != "errorMessage" {
		t.Fatalf("expected append spread alias with prefix args to resolve forbidden key \"errorMessage\", got %q", alias)
	}
}

func TestRecoverAliasViolationInSliceExprSupportsParenthesizedAppendSpreadExpr(t *testing.T) {
	const src = `package p

func f(logger interface{ Error(string, ...any) }) {
	panicVal := recover()
	bad := []any{"error", panicVal}
	args := []any{"ctx", 1}
	logger.Error("msg", (append(args, bad...))...)
}
`

	file, err := parser.ParseFile(token.NewFileSet(), "spread_append_paren.go", src, 0)
	if err != nil {
		t.Fatalf("parse source: %v", err)
	}

	var body *ast.BlockStmt
	var spreadExpr ast.Expr
	for _, decl := range file.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if !ok || fn.Name.Name != "f" {
			continue
		}
		body = fn.Body
		inspectBodyWithoutNestedFuncLits(body, func(node ast.Node) bool {
			call, ok := node.(*ast.CallExpr)
			if !ok {
				return true
			}
			if expr, ok := spreadArgExpr(call); ok {
				spreadExpr = expr
				return false
			}
			return true
		})
	}
	if body == nil || spreadExpr == nil {
		t.Fatal("failed to locate parenthesized append spread expression")
	}

	constValues := stringConstValueMap(file)
	constNameValues := constNameValueMap(constValues)
	recoverDerived := recoverDerivedIdentifiers(body)
	localNames := declaredNamesInBody(body)
	badSlices := recoverDerivedSlicesWithAliasViolations(body, recoverDerived, constValues, constNameValues, localNames)

	alias := recoverAliasViolationInSliceExpr(spreadExpr, recoverDerived, badSlices, constValues, constNameValues, localNames)
	if alias != "error" {
		t.Fatalf("expected parenthesized append spread alias to resolve forbidden key \"error\", got %q", alias)
	}
}

func TestKeyValueFromExprResolvesParenthesizedConstIdentifier(t *testing.T) {
	const src = `package p

const panicAlias = "panicValue"

func f() {
	var _ = (panicAlias)
}
`

	file, err := parser.ParseFile(token.NewFileSet(), "paren_const.go", src, 0)
	if err != nil {
		t.Fatalf("parse source: %v", err)
	}

	constValues := stringConstValueMap(file)
	constNameValues := constNameValueMap(constValues)

	var expr ast.Expr
	for _, decl := range file.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if !ok || fn.Name.Name != "f" {
			continue
		}
		for _, stmt := range fn.Body.List {
			declStmt, ok := stmt.(*ast.DeclStmt)
			if !ok {
				continue
			}
			genDecl, ok := declStmt.Decl.(*ast.GenDecl)
			if !ok {
				continue
			}
			for _, spec := range genDecl.Specs {
				valueSpec, ok := spec.(*ast.ValueSpec)
				if !ok || len(valueSpec.Values) == 0 {
					continue
				}
				expr = valueSpec.Values[0]
			}
		}
	}
	if expr == nil {
		t.Fatal("failed to locate parenthesized const identifier expression")
	}

	key, ok := keyValueFromExpr(expr, constValues, constNameValues, declaredNamesInBody(&ast.BlockStmt{}))
	if !ok {
		t.Fatal("expected parenthesized const identifier to resolve as key")
	}
	if key != "panicValue" {
		t.Fatalf("expected key to resolve as \"panicValue\", got %q", key)
	}
}

func TestIsRuntimeGoSourcePath(t *testing.T) {
	base := filepath.Join(string(filepath.Separator), "repo")

	testCases := []struct {
		name string
		path string
		want bool
	}{
		{
			name: "runtime pkg go file",
			path: filepath.Join(base, "pkg", "services", "authn", "client.go"),
			want: true,
		},
		{
			name: "runtime pkg go file uppercase extension",
			path: filepath.Join(base, "pkg", "services", "authn", "client.GO"),
			want: true,
		},
		{
			name: "runtime apps go file",
			path: filepath.Join(base, "apps", "dashboard", "migration.go"),
			want: true,
		},
		{
			name: "test file excluded",
			path: filepath.Join(base, "pkg", "services", "authn", "client_test.go"),
			want: false,
		},
		{
			name: "test file excluded uppercase suffix",
			path: filepath.Join(base, "pkg", "services", "authn", "client_TEST.GO"),
			want: false,
		},
		{
			name: "ruleguard rules excluded",
			path: filepath.Join(base, "pkg", "ruleguard.rules.go"),
			want: false,
		},
		{
			name: "ruleguard rules excluded uppercase suffix",
			path: filepath.Join(base, "pkg", "RULEGUARD.RULES.GO"),
			want: false,
		},
		{
			name: "non-ruleguard file with suffix fragment is included",
			path: filepath.Join(base, "pkg", "custom_ruleguard.rules.go"),
			want: true,
		},
		{
			name: "testdata path excluded",
			path: filepath.Join(base, "pkg", "services", "testdata", "fixture.go"),
			want: false,
		},
		{
			name: "non go file excluded",
			path: filepath.Join(base, "pkg", "services", "authn", "README.md"),
			want: false,
		},
		{
			name: "slash-separated testdata path excluded",
			path: "/repo/pkg/module/testdata/fixture.go",
			want: false,
		},
		{
			name: "windows-style testdata path excluded",
			path: `C:\repo\pkg\module\testdata\fixture.go`,
			want: false,
		},
		{
			name: "windows-style mixed-case testdata path excluded",
			path: `C:\repo\pkg\module\TestData\fixture.go`,
			want: false,
		},
		{
			name: "windows-style runtime uppercase go file included",
			path: `C:\repo\pkg\module\client.GO`,
			want: true,
		},
		{
			name: "windows-style uppercase test suffix excluded",
			path: `C:\repo\pkg\module\client_TEST.GO`,
			want: false,
		},
		{
			name: "windows-style uppercase ruleguard rules excluded",
			path: `C:\repo\pkg\RULEGUARD.RULES.GO`,
			want: false,
		},
		{
			name: "mixed-case testdata path excluded",
			path: filepath.Join(base, "pkg", "module", "TestData", "fixture.go"),
			want: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got := isRuntimeGoSourcePath(tc.path)
			if got != tc.want {
				t.Fatalf("isRuntimeGoSourcePath(%q) = %v, want %v", tc.path, got, tc.want)
			}
		})
	}
}

func TestRuntimeScanRootsIncludePkgAndApps(t *testing.T) {
	roots := runtimeScanRoots(t)
	if len(roots) != 2 {
		t.Fatalf("expected exactly 2 runtime scan roots, got %d (%v)", len(roots), roots)
	}

	rootNames := map[string]struct{}{}
	for _, root := range roots {
		rootNames[filepath.Base(root)] = struct{}{}
	}

	if _, ok := rootNames["pkg"]; !ok {
		t.Fatalf("runtime scan roots missing pkg: %v", roots)
	}
	if _, ok := rootNames["apps"]; !ok {
		t.Fatalf("runtime scan roots missing apps: %v", roots)
	}
}

func TestRuntimeScanRootsAreAbsoluteAndUnique(t *testing.T) {
	roots := runtimeScanRoots(t)
	if len(roots) == 0 {
		t.Fatal("expected runtime scan roots to be non-empty")
	}

	seen := map[string]struct{}{}
	for _, root := range roots {
		if !filepath.IsAbs(root) {
			t.Fatalf("expected runtime scan root to be absolute, got %q", root)
		}

		key := canonicalPathKey(root)
		if _, ok := seen[key]; ok {
			t.Fatalf("duplicate runtime scan root key %q in %v", key, roots)
		}
		seen[key] = struct{}{}
	}
}

func TestRuntimeScanRootsCanonicalOrder(t *testing.T) {
	roots := runtimeScanRoots(t)
	if len(roots) < 2 {
		t.Fatalf("expected at least two runtime scan roots, got %v", roots)
	}

	for idx := 1; idx < len(roots); idx++ {
		prev := canonicalPathKey(roots[idx-1])
		curr := canonicalPathKey(roots[idx])
		if prev > curr {
			t.Fatalf("runtime scan roots not in canonical order at index %d: %v", idx, roots)
		}
	}
}

func TestRuntimeScanRootsExistAsDirectories(t *testing.T) {
	roots := runtimeScanRoots(t)
	for _, root := range roots {
		info, err := os.Stat(root)
		if err != nil {
			t.Fatalf("expected runtime scan root %q to exist: %v", root, err)
		}
		if !info.IsDir() {
			t.Fatalf("expected runtime scan root %q to be a directory", root)
		}
	}
}

func TestWalkRuntimeGoFilesInRootsFiltersRuntimeFiles(t *testing.T) {
	tempDir := t.TempDir()
	pkgRoot := filepath.Join(tempDir, "pkg")
	appsRoot := filepath.Join(tempDir, "apps")
	missingRoot := filepath.Join(tempDir, "missing")

	if err := os.MkdirAll(filepath.Join(pkgRoot, "testdata"), 0o755); err != nil {
		t.Fatalf("mkdir pkg testdata: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(appsRoot, "nested", "testdata"), 0o755); err != nil {
		t.Fatalf("mkdir apps nested testdata: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(appsRoot, "nested", "TestData"), 0o755); err != nil {
		t.Fatalf("mkdir apps nested TestData: %v", err)
	}

	writeFile := func(path string) {
		t.Helper()
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatalf("mkdir parent for %s: %v", path, err)
		}
		if err := os.WriteFile(path, []byte("package p\n"), 0o644); err != nil {
			t.Fatalf("write file %s: %v", path, err)
		}
	}

	keepFiles := []string{
		filepath.Join(pkgRoot, "keep.go"),
		filepath.Join(pkgRoot, "keep_upper.GO"),
		filepath.Join(appsRoot, "nested", "keep.go"),
	}
	skipFiles := []string{
		filepath.Join(pkgRoot, "skip_test.go"),
		filepath.Join(pkgRoot, "skip_TEST.GO"),
		filepath.Join(pkgRoot, "ruleguard.rules.go"),
		filepath.Join(pkgRoot, "RULEGUARD.RULES.GO"),
		filepath.Join(pkgRoot, "testdata", "skip.go"),
		filepath.Join(appsRoot, "nested", "testdata", "skip.go"),
		filepath.Join(appsRoot, "nested", "TestData", "skip.go"),
		filepath.Join(appsRoot, "README.md"),
	}

	for _, path := range append(append([]string{}, keepFiles...), skipFiles...) {
		if strings.HasSuffix(path, ".md") {
			if err := os.WriteFile(path, []byte("not go"), 0o644); err != nil {
				t.Fatalf("write file %s: %v", path, err)
			}
			continue
		}
		writeFile(path)
	}

	visitedSet := map[string]struct{}{}
	err := walkRuntimeGoFilesInRoots([]string{pkgRoot, appsRoot, missingRoot}, func(path string) error {
		visitedSet[filepath.Clean(path)] = struct{}{}
		return nil
	})
	if err != nil {
		t.Fatalf("walk runtime roots: %v", err)
	}

	if len(visitedSet) != len(keepFiles) {
		t.Fatalf("visited %d files, expected %d (%v)", len(visitedSet), len(keepFiles), visitedSet)
	}
	for _, path := range keepFiles {
		if _, ok := visitedSet[filepath.Clean(path)]; !ok {
			t.Fatalf("expected runtime walk to include %s, visited=%v", path, visitedSet)
		}
	}
}

func TestWalkRuntimeGoFilesInRootsPropagatesVisitError(t *testing.T) {
	tempDir := t.TempDir()
	pkgRoot := filepath.Join(tempDir, "pkg")
	if err := os.MkdirAll(pkgRoot, 0o755); err != nil {
		t.Fatalf("mkdir pkg root: %v", err)
	}

	goPath := filepath.Join(pkgRoot, "keep.go")
	if err := os.WriteFile(goPath, []byte("package p\n"), 0o644); err != nil {
		t.Fatalf("write go file: %v", err)
	}

	visitErr := errors.New("visit failed")
	err := walkRuntimeGoFilesInRoots([]string{pkgRoot}, func(path string) error {
		return visitErr
	})
	if !errors.Is(err, visitErr) {
		t.Fatalf("expected visit error %v, got %v", visitErr, err)
	}
}

func TestWalkRuntimeGoFilesInRootsSkipsNonDirectoryRoots(t *testing.T) {
	tempDir := t.TempDir()
	nonDirRoot := filepath.Join(tempDir, "not_a_directory")
	if err := os.WriteFile(nonDirRoot, []byte("package p\n"), 0o644); err != nil {
		t.Fatalf("write non-directory root file: %v", err)
	}

	visited := false
	err := walkRuntimeGoFilesInRoots([]string{nonDirRoot}, func(path string) error {
		visited = true
		return nil
	})
	if err != nil {
		t.Fatalf("walk non-directory root: %v", err)
	}
	if visited {
		t.Fatal("expected non-directory roots to be skipped")
	}
}

func TestWalkRuntimeGoFilesInRootsRejectsNilVisitor(t *testing.T) {
	err := walkRuntimeGoFilesInRoots([]string{t.TempDir()}, nil)
	if err == nil {
		t.Fatal("expected nil visitor to return an error")
	}
	if !errors.Is(err, errRuntimeFileWalkerVisitor) {
		t.Fatalf("expected nil visitor error to match sentinel")
	}
	if err.Error() != errRuntimeFileWalkerVisitorNil {
		t.Fatalf("expected nil visitor error %q, got %q", errRuntimeFileWalkerVisitorNil, err.Error())
	}
}

func TestWalkRuntimeGoFilesInRootsHandlesEmptyRoots(t *testing.T) {
	visited := false
	err := walkRuntimeGoFilesInRoots(nil, func(path string) error {
		visited = true
		return nil
	})
	if err != nil {
		t.Fatalf("walk empty roots: %v", err)
	}
	if visited {
		t.Fatal("expected empty root list to produce no visits")
	}

	err = walkRuntimeGoFilesInRoots([]string{"", "   "}, func(path string) error {
		visited = true
		return nil
	})
	if err != nil {
		t.Fatalf("walk whitespace roots: %v", err)
	}
	if visited {
		t.Fatal("expected whitespace-only roots to produce no visits")
	}
}

func TestWalkRuntimeGoFilesInRootsDeduplicatesRoots(t *testing.T) {
	tempDir := t.TempDir()
	root := filepath.Join(tempDir, "pkg")
	if err := os.MkdirAll(root, 0o755); err != nil {
		t.Fatalf("mkdir root: %v", err)
	}
	filePath := filepath.Join(root, "keep.go")
	if err := os.WriteFile(filePath, []byte("package p\n"), 0o644); err != nil {
		t.Fatalf("write go file: %v", err)
	}

	visitCount := 0
	err := walkRuntimeGoFilesInRoots([]string{root, filepath.Clean(root), root}, func(path string) error {
		visitCount++
		return nil
	})
	if err != nil {
		t.Fatalf("walk duplicate roots: %v", err)
	}
	if visitCount != 1 {
		t.Fatalf("expected deduplicated roots to visit file once, visited %d times", visitCount)
	}
}

func TestWalkRuntimeGoFilesInRootsDeduplicatesRelativeAndAbsoluteEquivalentRoots(t *testing.T) {
	cwd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}

	root := t.TempDir()
	relRoot := relativePathOrSkip(t, cwd, root)

	goFile := filepath.Join(root, "keep.go")
	if err := os.WriteFile(goFile, []byte("package p\n"), 0o644); err != nil {
		t.Fatalf("write go file: %v", err)
	}

	visitCount := 0
	err = walkRuntimeGoFilesInRoots([]string{relRoot, root}, func(path string) error {
		visitCount++
		return nil
	})
	if err != nil {
		t.Fatalf("walk relative+absolute roots: %v", err)
	}
	if visitCount != 1 {
		t.Fatalf("expected relative/absolute equivalent roots to visit once, visited %d times", visitCount)
	}
}

func TestWalkRuntimeGoFilesInRootsDeterministicRootOrder(t *testing.T) {
	tempDir := t.TempDir()
	rootA := filepath.Join(tempDir, "a_root")
	rootB := filepath.Join(tempDir, "b_root")
	if err := os.MkdirAll(rootA, 0o755); err != nil {
		t.Fatalf("mkdir rootA: %v", err)
	}
	if err := os.MkdirAll(rootB, 0o755); err != nil {
		t.Fatalf("mkdir rootB: %v", err)
	}
	if err := os.WriteFile(filepath.Join(rootA, "keep.go"), []byte("package a\n"), 0o644); err != nil {
		t.Fatalf("write rootA file: %v", err)
	}
	if err := os.WriteFile(filepath.Join(rootB, "keep.go"), []byte("package b\n"), 0o644); err != nil {
		t.Fatalf("write rootB file: %v", err)
	}

	visited := make([]string, 0, 2)
	err := walkRuntimeGoFilesInRoots([]string{rootB, rootA}, func(path string) error {
		visited = append(visited, filepath.Base(filepath.Dir(path)))
		return nil
	})
	if err != nil {
		t.Fatalf("walk roots deterministic order: %v", err)
	}
	if len(visited) != 2 {
		t.Fatalf("expected 2 visited files, got %d (%v)", len(visited), visited)
	}
	if visited[0] != "a_root" || visited[1] != "b_root" {
		t.Fatalf("expected deterministic root order [a_root b_root], got %v", visited)
	}
}

func TestUniqueNonEmptyCleanPaths(t *testing.T) {
	input := []string{
		"",
		"   ",
		".",
		"./",
		"/tmp/runtime",
		"/tmp/runtime/",
		" /tmp/runtime ",
		"/tmp/runtime/../runtime",
		"/tmp/other",
		`C:\repo\pkg`,
		`C:/repo/pkg`,
		`c:/repo/pkg`,
		`\\server\share\pkg`,
	}

	got := uniqueNonEmptyCleanPaths(input)
	want := []string{
		"/tmp/runtime",
		"/tmp/other",
		`C:\repo\pkg`,
		`\\server\share\pkg`,
	}

	if len(got) != len(want) {
		t.Fatalf("uniqueNonEmptyCleanPaths length = %d, want %d; got=%v", len(got), len(want), got)
	}
	wantSet := map[string]struct{}{}
	for _, path := range want {
		wantSet[path] = struct{}{}
	}
	for _, path := range got {
		if _, ok := wantSet[path]; !ok {
			t.Fatalf("uniqueNonEmptyCleanPaths contains unexpected path %q (full=%v)", path, got)
		}
		delete(wantSet, path)
	}
	if len(wantSet) > 0 {
		t.Fatalf("uniqueNonEmptyCleanPaths missing expected paths %v (full=%v)", wantSet, got)
	}
}

func TestUniqueNonEmptyCleanPathsDeterministicAcrossInputOrder(t *testing.T) {
	pathsA := []string{"/tmp/runtime-b", "/tmp/runtime-a", "/tmp/runtime-b"}
	pathsB := []string{"/tmp/runtime-a", "/tmp/runtime-b"}

	gotA := uniqueNonEmptyCleanPaths(pathsA)
	gotB := uniqueNonEmptyCleanPaths(pathsB)

	if len(gotA) != len(gotB) {
		t.Fatalf("deterministic order length mismatch: gotA=%v gotB=%v", gotA, gotB)
	}
	for idx := range gotA {
		if gotA[idx] != gotB[idx] {
			t.Fatalf("deterministic order mismatch at %d: gotA=%v gotB=%v", idx, gotA, gotB)
		}
	}
}

func TestUniqueNonEmptyCleanPathsDeduplicatesRelativeAndAbsoluteEquivalent(t *testing.T) {
	cwd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}

	absRoot := t.TempDir()
	relRoot := relativePathOrSkip(t, cwd, absRoot)

	got := uniqueNonEmptyCleanPaths([]string{relRoot, absRoot})
	if len(got) != 1 {
		t.Fatalf("expected relative/absolute equivalent roots to dedupe, got %v", got)
	}
	if got[0] != filepath.Clean(absRoot) {
		t.Fatalf("expected deduped root to normalize to absolute path %q, got %q", filepath.Clean(absRoot), got[0])
	}
}

func TestCanonicalPathKeyNormalization(t *testing.T) {
	testCases := []struct {
		name string
		in   string
		want string
	}{
		{
			name: "windows backslashes normalize",
			in:   `C:\repo\pkg`,
			want: "c:/repo/pkg",
		},
		{
			name: "windows slashes normalize",
			in:   `C:/repo/pkg`,
			want: "c:/repo/pkg",
		},
		{
			name: "linux path unchanged",
			in:   "/tmp/runtime",
			want: "/tmp/runtime",
		},
		{
			name: "windows unc keeps double slash",
			in:   `\\server\share\pkg`,
			want: "//server/share/pkg",
		},
		{
			name: "unc with repeated slashes normalizes and keeps prefix",
			in:   "////server//share//pkg",
			want: "//server/share/pkg",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got := canonicalPathKey(tc.in)
			if got != tc.want {
				t.Fatalf("canonicalPathKey(%q) = %q, want %q", tc.in, got, tc.want)
			}
		})
	}
}

func relativePathOrSkip(t *testing.T, base, target string) string {
	t.Helper()

	rel, err := filepath.Rel(base, target)
	if err != nil {
		t.Skipf("cannot build relative path from %q to %q: %v", base, target, err)
	}
	return rel
}

func TestWindowsPathShapeHelpers(t *testing.T) {
	testCases := []struct {
		name          string
		path          string
		wantDrivePath bool
		wantUNCPath   bool
	}{
		{
			name:          "windows drive path",
			path:          `C:\repo\pkg`,
			wantDrivePath: true,
			wantUNCPath:   false,
		},
		{
			name:          "windows unc path",
			path:          `\\server\share\pkg`,
			wantDrivePath: false,
			wantUNCPath:   true,
		},
		{
			name:          "linux absolute path",
			path:          "/tmp/runtime",
			wantDrivePath: false,
			wantUNCPath:   false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if got := isWindowsDrivePath(tc.path); got != tc.wantDrivePath {
				t.Fatalf("isWindowsDrivePath(%q) = %v, want %v", tc.path, got, tc.wantDrivePath)
			}
			if got := isWindowsUNCPath(tc.path); got != tc.wantUNCPath {
				t.Fatalf("isWindowsUNCPath(%q) = %v, want %v", tc.path, got, tc.wantUNCPath)
			}
		})
	}
}

func TestCollapseConsecutiveSlashes(t *testing.T) {
	testCases := []struct {
		name string
		in   string
		want string
	}{
		{
			name: "already normalized",
			in:   "/tmp/runtime",
			want: "/tmp/runtime",
		},
		{
			name: "collapses middle runs",
			in:   "/tmp//runtime///file",
			want: "/tmp/runtime/file",
		},
		{
			name: "collapses leading runs to single slash",
			in:   "////server/share",
			want: "/server/share",
		},
		{
			name: "empty stays empty",
			in:   "",
			want: "",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got := collapseConsecutiveSlashes(tc.in)
			if got != tc.want {
				t.Fatalf("collapseConsecutiveSlashes(%q) = %q, want %q", tc.in, got, tc.want)
			}
		})
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

func runtimeScanRoots(t *testing.T) []string {
	t.Helper()

	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("resolve current test file path")
	}

	pkgDir := filepath.Dir(thisFile)
	repoRoot := filepath.Clean(filepath.Join(pkgDir, ".."))
	return uniqueNonEmptyCleanPaths([]string{
		filepath.Join(repoRoot, "pkg"),
		filepath.Join(repoRoot, "apps"),
	})
}

func walkRuntimeGoFiles(t *testing.T, visit func(path string) error) error {
	t.Helper()

	return walkRuntimeGoFilesInRoots(runtimeScanRoots(t), visit)
}

func walkRuntimeGoFilesInRoots(roots []string, visit func(path string) error) error {
	if visit == nil {
		return errRuntimeFileWalkerVisitor
	}

	for _, root := range uniqueNonEmptyCleanPaths(roots) {
		info, err := os.Stat(root)
		if err != nil {
			if os.IsNotExist(err) {
				continue
			}
			return err
		}
		if !info.IsDir() {
			continue
		}
		if err := filepath.WalkDir(root, func(path string, d os.DirEntry, walkErr error) error {
			if walkErr != nil {
				return walkErr
			}
			if d.IsDir() {
				return nil
			}
			if !isRuntimeGoSourcePath(path) {
				return nil
			}
			return visit(path)
		}); err != nil {
			return err
		}
	}

	return nil
}

func uniqueNonEmptyCleanPaths(paths []string) []string {
	seen := map[string]struct{}{}
	unique := make([]string, 0, len(paths))

	for _, path := range paths {
		raw := strings.TrimSpace(path)
		if raw == "" {
			continue
		}

		cleaned := filepath.Clean(raw)
		if cleaned == "" || cleaned == "." {
			continue
		}
		key := canonicalPathKey(cleaned)
		if !filepath.IsAbs(cleaned) && !isWindowsDrivePath(cleaned) && !isWindowsUNCPath(cleaned) {
			if absPath, err := filepath.Abs(cleaned); err == nil {
				key = canonicalPathKey(absPath)
				cleaned = filepath.Clean(absPath)
			}
		}
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		unique = append(unique, cleaned)
	}

	sort.SliceStable(unique, func(i, j int) bool {
		return canonicalPathKey(unique[i]) < canonicalPathKey(unique[j])
	})

	return unique
}

func canonicalPathKey(path string) string {
	key := strings.ReplaceAll(filepath.ToSlash(path), "\\", "/")
	uncPrefix := strings.HasPrefix(key, "//")
	key = collapseConsecutiveSlashes(key)
	if uncPrefix && !strings.HasPrefix(key, "//") {
		key = "/" + key
	}
	if len(key) >= 2 && key[1] == ':' {
		key = strings.ToLower(string(key[0])) + key[1:]
	}
	return key
}

func isWindowsDrivePath(path string) bool {
	normalized := strings.ReplaceAll(filepath.ToSlash(path), "\\", "/")
	return len(normalized) >= 2 && normalized[1] == ':'
}

func isWindowsUNCPath(path string) bool {
	normalized := strings.ReplaceAll(filepath.ToSlash(path), "\\", "/")
	return strings.HasPrefix(normalized, "//")
}

func collapseConsecutiveSlashes(path string) string {
	var b strings.Builder
	b.Grow(len(path))

	prevSlash := false
	for _, r := range path {
		if r == '/' {
			if prevSlash {
				continue
			}
			prevSlash = true
		} else {
			prevSlash = false
		}
		b.WriteRune(r)
	}

	return b.String()
}

func isRuntimeGoSourcePath(path string) bool {
	lowerPath := strings.ToLower(path)
	normalizedPath := strings.ReplaceAll(path, "\\", "/")
	lowerBase := strings.ToLower(filepath.Base(normalizedPath))
	if !strings.HasSuffix(lowerPath, ".go") || strings.HasSuffix(lowerPath, "_test.go") || lowerBase == "ruleguard.rules.go" {
		return false
	}

	cleanPath := filepath.ToSlash(filepath.Clean(path))
	cleanPath = strings.ReplaceAll(cleanPath, "\\", "/")
	pathSegments := strings.Split(cleanPath, "/")
	for _, segment := range pathSegments {
		if strings.EqualFold(segment, "testdata") {
			return false
		}
	}

	return true
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

func spreadArgExpr(call *ast.CallExpr) (ast.Expr, bool) {
	if call == nil || !call.Ellipsis.IsValid() || len(call.Args) == 0 {
		return nil, false
	}
	return call.Args[len(call.Args)-1], true
}

func isSpreadVariadicArg(call *ast.CallExpr, argIdx int) bool {
	if call == nil || !call.Ellipsis.IsValid() || len(call.Args) == 0 {
		return false
	}
	return argIdx == len(call.Args)-1
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
	case *ast.ParenExpr:
		return recoverAliasViolationInSliceExpr(n.X, recoverDerived, badSlices, constValues, constNameValues, localNames)
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
			if n.Ellipsis.IsValid() && len(n.Args) >= 2 {
				lastArg := n.Args[len(n.Args)-1]
				if alias := recoverAliasViolationInSliceExpr(lastArg, recoverDerived, badSlices, constValues, constNameValues, localNames); alias != "" {
					return alias
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
	if paren, ok := expr.(*ast.ParenExpr); ok {
		return keyValueFromExpr(paren.X, constValues, constNameValues, localNames)
	}

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
			if n.Tok != token.VAR && n.Tok != token.CONST {
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

func TestDeclaredNamesInBodyIncludesLocalConstAndVarNames(t *testing.T) {
	const src = `package p

func f() {
	const (
		localConst = "panicValue"
	)
	var localVar = localConst
	for idx := range []int{1,2,3} {
		_ = idx
	}
	_ = localVar
}
`

	file, err := parser.ParseFile(token.NewFileSet(), "declared_names.go", src, 0)
	if err != nil {
		t.Fatalf("parse body sample: %v", err)
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
		t.Fatal("failed to locate function body")
	}

	names := declaredNamesInBody(body)
	for _, expected := range []string{"localConst", "localVar", "idx"} {
		if _, ok := names[expected]; !ok {
			t.Fatalf("expected declaredNamesInBody to include %q", expected)
		}
	}
}
