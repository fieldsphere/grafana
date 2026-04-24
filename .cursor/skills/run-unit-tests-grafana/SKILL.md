---
name: run-unit-tests-grafana
description: Runs targeted unit tests in the Grafana monorepo using path-based command selection for frontend Jest, plugin-local Jest, and Go backend package tests. Use when the user asks to run unit tests, validate a change, test a file, or pick the right test command for changed code.
---

# Run unit tests for Grafana

## Quick start

1. Map changed files to the smallest test scope.
2. Run targeted unit tests first.
3. Only broaden scope if targeted tests pass and more confidence is needed.

## Command selection

Use this decision tree in order:

1. **Frontend in `public/app/**` or shared frontend packages covered by root Jest**
   - Prefer:
     - `yarn test:ci --runTestsByPath <TEST_FILE_PATH>`
   - Use this for one or a few Jest test files.

2. **Datasource plugin frontend under `public/app/plugins/datasource/*` with local Jest config**
   - Run plugin-local tests from the plugin directory:
     - `yarn test:ci`
   - Typical plugin path:
     - `public/app/plugins/datasource/<plugin-name>/`

3. **Backend Go code under `pkg/**` or `apps/**`**
   - Run package-local unit tests:
     - `go test -v -short <GO_PACKAGE>`
   - Example package targets:
     - `./pkg/services/ngalert/...`
     - `./apps/advisor/pkg/...`

4. **`all.go` changed**
   - Treat as production code.
   - Run nearby package unit tests first using `go test -v -short <GO_PACKAGE>`.
   - If user asks for broader validation, suggest related integration suites.

## Practical workflow

1. Identify changed files and infer test file/package paths.
2. Run the narrowest matching command from the selection rules.
3. If a run fails, report failing tests with file and error summary.
4. If no direct test file exists, run closest package-level unit tests.
5. Avoid unrelated broad test runs unless the user asks.

## Examples

### Example: frontend file in core app

Run one Jest file:

```sh
yarn test:ci --runTestsByPath public/app/features/alerting/unified/components/RuleEditor.test.tsx
```

### Example: datasource plugin frontend change

Run local plugin tests:

```sh
cd public/app/plugins/datasource/loki && yarn test:ci
```

### Example: backend package change

Run targeted Go package tests:

```sh
go test -v -short ./pkg/services/accesscontrol/...
```

## Output expectations

- Report:
  - The command that ran.
  - Whether it passed or failed.
  - Key failures (test name + short error).
- When all targeted tests pass, state that broader coverage is optional.
