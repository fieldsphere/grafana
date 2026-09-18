---
name: run-unit-tests
description: Run Grafana unit tests (Jest frontend, Go backend) with one-shot commands, targeted paths, and Cloud/CI gotchas. Use when the user asks to run unit tests, execute Jest or go test, verify a change with tests, or check frontend/backend test results. Do not use for writing tests or Playwright E2E.
---

# Run Grafana unit tests

Execute tests. Do not write or rewrite them here — that is `frontend-testing-strategy` / `panel-testing-strategy`. Do not start Playwright.

Run from the repo root. Use the Shell tool; do not tell the user to run the commands.

## Scope first

Never run the full frontend or backend suite unless the user explicitly asks.

1. User named a file, folder, or test → run that.
2. Otherwise infer from the git diff / files just changed.
3. If still unclear, ask. Do not default to `make test`, `make test-go-unit`, or root `jest` with no path.

`make test` runs Go unit **and** integration **and** `yarn test` (watch mode). `make test-js` is also watch mode. Do not use either.

## Frontend (Jest)

Root `package.json` `"test"` is `jest --notify --watch`. A one-shot run **must** disable watch.

```sh
# login shell so nvm Node (pinned in .nvmrc) wins over /exec-daemon/node
bash -lc 'yarn jest --watchAll=false -- path/to/file.test.tsx'
```

Also valid: `yarn test path/to/file.test.tsx --watchAll=false` or `yarn jest --no-watch -- path`.

| Goal | Command |
| --- | --- |
| One file | `yarn jest --watchAll=false -- path/to/Foo.test.tsx` |
| One test name | `yarn jest --watchAll=false -t "exact or regex name"` |
| One directory | `yarn jest --watchAll=false -- public/app/features/dashboard/` |
| Coverage for a path | `yarn jest --watchAll=false --coverage -- path` |

Root Jest (`jest.config.js`):

- Files: `*.test.ts(x)` / `*.test.js(x)` under `public/app`, `public/test`, `packages`, `scripts/tests`.
- Timeout: 30s. Env: jsdom. `TZ=Pacific/Easter`.
- These plugin trees are **ignored** by root Jest (own workspaces):
  - `public/app/plugins/datasource/azuremonitor` → `@grafana-plugins/grafana-azure-monitor-datasource`
  - `public/app/plugins/datasource/cloudwatch` → `@grafana-plugins/grafana-cloudwatch-datasource`
  - `public/app/plugins/datasource/grafana-testdata-datasource` → `@grafana-plugins/grafana-testdata-datasource`
  - `public/app/plugins/datasource/graphite` → `@grafana-plugins/graphite`

Decoupled plugin (one-shot, no watch):

```sh
bash -lc 'yarn workspace @grafana-plugins/graphite test:ci -- path/to/file.test.ts'
```

`packages/grafana-test-utils` (`@grafana/test-utils`) uses the same `test:ci` pattern. `packages/grafana-eslint-rules` (`@grafana/eslint-plugin`) uses `yarn workspace @grafana/eslint-plugin test`.

Rspack script tests only: `yarn test:rspack` (Vitest, `scripts/rspack/vitest.config.ts`). Not the app unit suite.

This fork's Fieldsphere CI runs frontend **lint + typecheck only**. Frontend unit tests are local unless the user asks to add CI.

## Backend (Go)

Unit tests are `go test -short`. Integration tests are `TestIntegration*` (and some `//go:build integration`); do not run those unless asked.

```sh
# package (preferred)
go test -short -count=1 -timeout=2m ./pkg/services/myservice/

# one test
go test -short -count=1 -timeout=2m -run TestName ./pkg/services/myservice/

# pretty output for a known package
make test-go-unit-pretty FILES=./pkg/services/myservice
```

`go.work` includes `apps/*` and several `pkg/*` modules. Test those as their own module paths:

```sh
go test -short -count=1 -timeout=2m ./apps/dashboard/...
```

| Avoid unless explicitly requested | Why |
| --- | --- |
| `make test-go-unit` | Full tree, `-timeout=30m`, sharded via `scripts/ci/backend-tests/shard.sh` |
| `go test ./pkg/...` (no `-short`) | Pulls integration tests |
| `make test-go-integration*` | Needs extra DBs (`devenv`); not unit |
| Untargeted `./pkg/api/` | Slow compile (~2 min) even for one `-run` |

CI (`.github/workflows/fieldsphere-ci.yml`) matches: `CGO_ENABLED=0 go test -short` across four package shards. Optional local match: `CGO_ENABLED=0 go test -short -timeout=2m ./path`.

Race detector: `GO_RACE=1 make test-go-unit` or `go test -race -short`. Only when asked.

## Cloud / local gotchas

- Frontend: always `bash -lc` (or another login shell) for `yarn` / `jest` so `.nvmrc` Node is used. Plain non-login PATH may resolve `/exec-daemon/node`.
- `yarn test` without `--watchAll=false` hangs in watch mode. Never background a watch-mode Jest as "the test run."
- Backend packages such as `pkg/api/` have large graphs; keep `-run` **and** a narrow package path.
- GCC is required only if CGo/SQLite tests need `CGO_ENABLED=1`. Default unit path matches CI (`CGO_ENABLED=0`).

## Report results

After the run, state: command used, pass/fail counts, failed test names, and the first actionable error. Re-run only the failing file/name while iterating. Do not paste entire Jest/Go logs.
