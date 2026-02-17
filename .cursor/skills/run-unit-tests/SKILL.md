---
name: run-unit-tests
description: Run Grafana unit tests with a targeted-first workflow for frontend Jest and backend Go packages. Use when the user asks to run unit tests, verify a change with tests, or troubleshoot failing unit tests in this repository.
---

# Run unit tests

## Instructions
When the user asks to run unit tests, execute tests yourself using a targeted-first approach.

1. Identify changed files with `git diff --name-only` (or use user-provided paths).
2. Run only relevant unit tests first.
3. If targeted tests pass and user asks for broader confidence, run a broader suite.
4. If tests fail, report the failing command, key error lines, and the smallest useful rerun command.

## Targeted commands

### Frontend (TypeScript/JavaScript)
Use Jest through Yarn in non-watch mode:

```sh
yarn test:ci <TEST_FILE_OR_PATTERN>
```

Examples:

```sh
yarn test:ci public/app/core/utils/explore.test.ts
yarn test:ci packages/grafana-ui/src/components/Button/Button.test.tsx
```

If you only know the feature area, run:

```sh
yarn test:ci <PATH_SEGMENT>
```

### Backend (Go)
Run package-level unit tests with `-short`:

```sh
go test -v -short ./pkg/<PACKAGE_PATH>/...
```

Examples:

```sh
go test -v -short ./pkg/services/auth/...
go test -v -short ./pkg/services/ngalert/...
```

For repo-standard backend unit coverage, use:

```sh
make test-go-unit
```

## Escalation rules
- If a single test file fails, rerun that specific test target first.
- If multiple related targets fail, run the package/feature scope.
- Run full backend or frontend unit suites only when requested, or when targeted runs are insufficient to isolate the failure.

## Output format
After running tests, report:
- Commands executed.
- Pass/fail status per command.
- For failures: first actionable error and the smallest rerun command.

## Notes
- Do not run end-to-end tests for a unit-test request unless explicitly asked.
- Do not start dev servers to run unit tests.
- Prefer concise output summaries; include enough detail to debug quickly.
