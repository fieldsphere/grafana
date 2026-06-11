---
name: run-unit-tests
description: Runs Grafana unit tests with the smallest relevant scope across frontend Jest and backend Go packages. Use when the user asks to run unit tests, validate changes, test modified files, or choose the right test command for a code change.
---

# Run unit tests

## Instructions

When asked to run unit tests, **execute them with the Shell tool** from the repo root (`grafana/`). Do not ask the user to run commands. Pick the smallest command that validates the change set. Do not default to full-suite runs.

Consult `.cursor/rules/test-directory-map.mdc` before choosing scope.

## Test discovery

1. Identify changed or mentioned source files.
2. Find matching unit tests:
   - **Frontend**: `*.test.ts`, `*.test.tsx`, `*.test.js`, `*.test.jsx` (Jest `testRegex`)
   - **Backend**: `*_test.go` in the same package directory
3. If no test file exists for a changed source file, use related-tests mode (frontend) or package-level `go test` (backend).

## Scope selection

Map files to one bucket:

| Path | Test runner |
|------|-------------|
| `public/app/**` (non-decoupled plugins) | Root Jest |
| `packages/**` (covered by root `jest.config.js` roots) | Root Jest |
| `public/app/plugins/datasource/*` with local `jest.config.js` or `test:ci` script | Plugin-local Jest |
| `pkg/**`, `apps/**` | `go test -v -short` |

**Decoupled datasource plugins** (excluded from root Jest — run locally): `azuremonitor`, `cloud-monitoring`, `elasticsearch`, `grafana-postgresql-datasource`, `grafana-pyroscope-datasource`, `grafana-testdata-datasource`, `jaeger`, `loki`, `mysql`, `parca`, `tempo`, `zipkin`. Also check any plugin with its own `jest.config.js`.

Do **not** run integration tests in this skill. After unit tests pass, hand off to the integration test skill (see below).

## Frontend unit tests

Run from repo root.

**Single test file:**

```sh
yarn test:ci --runTestsByPath <TEST_FILE_PATH>
```

**Source file changed, no test file given:**

```sh
yarn test:ci --findRelatedTests <SOURCE_FILE_PATH>
```

**Decoupled datasource plugin** — `cd` to plugin dir, then:

```sh
yarn test:ci
```

Add `--runTestsByPath` or `--findRelatedTests` when scope is known.

**Package with own Jest** (`packages/grafana-test-utils`):

```sh
yarn workspace @grafana/test-utils test:ci
```

## Backend unit tests

**Targeted package** (preferred):

```sh
go test -v -short <GO_PACKAGE>
```

Derive package from file path:
- `pkg/services/ngalert/foo.go` → `./pkg/services/ngalert/...`
- `apps/live/pkg/app/app.go` → `./apps/live/...`

**Single test function:**

```sh
go test -v -short <GO_PACKAGE> -run <TEST_NAME_REGEX>
```

**App with Makefile** (`apps/*/Makefile`):

```sh
make -C apps/<app-name> test
```

Runs code generation then `go test ./...`.

**Pretty output for a specific package:**

```sh
make test-go-unit-pretty FILES=./pkg/services/mysvc
```

## Special mapping

- `all.go` files are production code. For `pkg/registry/apis/provisioning/jobs/export/all.go`, run unit tests in `pkg/registry/apis/provisioning/jobs/export/`.

## Escalation order

Only escalate when targeted runs pass or are insufficient:

1. File-level frontend (`--runTestsByPath`) or backend package (`go test -v -short ./pkg/...`)
2. Plugin-local `yarn test:ci`
3. Broader scope:
   - `yarn packages:test:ci` — all tagged packages
   - `yarn plugin:test:ci` — all tagged plugins
   - `make test-go-unit` — full backend unit suite
   - `yarn test:ci` — full frontend unit suite (slow)
   - `make test` — full frontend + backend (slowest)

## After running

Report pass/fail, failing test names, and relevant error output. If tests fail, diagnose before re-running a broader suite.

## Integration test handoff

After unit tests pass, continue with `.cursor/skills/run-integration-tests/SKILL.md` when:

- The user asked to run integration tests or full validation
- Changed files are under `pkg/registry/apis/**`, `apps/**`, or other backend areas with `TestIntegration*` coverage in `pkg/tests/**`
- An `all.go` file changed (see special mapping above)

Read and follow the integration test skill. Do not skip the unit-test step unless the user explicitly requests it.

## Examples

Frontend single file:

```sh
yarn test:ci --runTestsByPath public/app/features/dashboard/components/DashboardScene.test.tsx
```

Frontend related tests:

```sh
yarn test:ci --findRelatedTests packages/grafana-data/src/datetime/datemath.ts
```

Plugin-local (Loki):

```sh
cd public/app/plugins/datasource/loki && yarn test:ci --findRelatedTests src/components/LokiQueryField.tsx
```

Backend package:

```sh
go test -v -short ./pkg/services/authn/...
```

Backend single test:

```sh
go test -v -short ./apps/live/... -run TestApp
```

App Makefile:

```sh
make -C apps/live test
```
