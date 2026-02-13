---
name: run-unit-tests
description: Runs Grafana unit tests for backend and frontend using repository-native commands. Use when the user asks to run unit tests, verify a change, run Jest tests, or run Go unit tests without integration or end-to-end suites.
---

# Run unit tests

## Instructions
When asked to run unit tests for this repository, execute commands directly with the Shell tool from the repo root.

Prefer targeted tests first, then expand to broader unit test runs if needed.

## Primary commands

### Backend unit tests
Use the Make target for backend unit tests:

```sh
make test-go-unit
```

For a specific backend package:

```sh
go test -v -short ./pkg/<PACKAGE_PATH>/...
```

For a specific backend test name:

```sh
go test -v -short ./pkg/<PACKAGE_PATH>/... -run '^<TEST_NAME>$'
```

### Frontend unit tests
Use non-watch mode for reliable automation:

```sh
yarn test:ci
```

For a specific frontend test file or pattern:

```sh
yarn jest <TEST_PATH_OR_GLOB> --ci
```

## Recommended workflow
1. If the user changed specific files, run targeted unit tests first.
2. If targeted tests pass, run broader unit tests only when needed:
   - `make test-go-unit`
   - `yarn test:ci`
3. Report pass/fail clearly and include failing test names and commands used.

## Constraints
- Do not run integration or end-to-end suites unless explicitly requested.
- Avoid `yarn test` for automation because it starts watch mode.
- If frontend dependencies are missing, run:

```sh
corepack enable
corepack install
yarn install --immutable
```

<!--
Directory size audit (required):
du -h ".cursor/skills/run-unit-tests" "contribute/architecture"
8.0K	.cursor/skills/run-unit-tests
48K	contribute/architecture

Newly added file sizes:
du -h ".cursor/skills/run-unit-tests/SKILL.md" "contribute/architecture/api-to-apis-migration-status.md"
4.0K	.cursor/skills/run-unit-tests/SKILL.md
12K	contribute/architecture/api-to-apis-migration-status.md
-->
