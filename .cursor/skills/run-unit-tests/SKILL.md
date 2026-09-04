---
name: run-unit-tests
description: Run Grafana frontend Jest and backend Go unit tests for changed or requested packages. Use when the user asks to run unit tests, yarn jest, go test -short, or make test-go-unit. After unit tests pass, continue with `.cursor/skills/run-integration-tests/SKILL.md`.
---

# Run unit tests

Run existing unit tests. Do not write new tests here — that belongs to `.claude/skills/frontend-testing-strategy` (and `.claude/skills/panel-testing-strategy` for viz). Do not treat `TestIntegration*` or Playwright as unit tests.

Execute commands with the Shell tool. Do not ask the user to run them. Use a login shell (`bash -lc` or tmux) so Node is the pinned version from `.nvmrc`.

## Scope

Do not run the full backend or frontend suite unless the user asks. Target the packages or files they named, or the files changed in this work.

| Layer | What counts | What does not |
| ----- | ----------- | ------------- |
| Frontend | `*.test.ts(x)` / `*.test.js(x)` under Jest roots | Playwright (`yarn e2e:playwright`), `.test.scenario.ts` integration scenarios |
| Backend | `go test -short` / `make test-go-unit` | `TestIntegration*` (`make test-go-integration`) |

## Frontend (Jest)

`yarn test` is watch mode. Always run once and exit:

```sh
yarn jest --no-watch <path-or-pattern>
```

Roots in `jest.config.js`: `public/app`, `public/test`, `packages`, `scripts/tests`.

Decoupled plugins are excluded from the root Jest config. Run them via workspace `test:ci` (also not watch):

```sh
yarn workspace @grafana-plugins/grafana-azure-monitor-datasource test:ci
yarn workspace @grafana-plugins/grafana-cloudwatch-datasource test:ci
yarn workspace @grafana-plugins/grafana-testdata-datasource test:ci
yarn workspace @grafana-plugins/graphite test:ci
```

Separate Jest configs (not the root config):

```sh
yarn workspace @grafana/test-utils test:ci
yarn workspace @grafana/eslint-plugin test
```

## Backend (Go)

Unit tests use `-short`, which skips `TestIntegration*` via `testutil.SkipIntegrationTestInShortMode`.

```sh
go test -short -run TestName ./pkg/services/myservice/
```

Full backend unit suite (slow, ~30m, sharded with `SHARD`/`SHARDS`) only when requested:

```sh
make test-go-unit
```

`pkg/api/` compiles slowly (~2 min) on first test in that graph.

## Cloud / CI notes

- Infra injects `/exec-daemon/node` ahead of nvm in non-login shells. Login shells get the pinned Node.
- This fork's PR CI does not run the archived frontend unit-test workflow; still run the scoped Jest command locally.
- `make test` runs unit + integration + frontend. Do not use it as a unit-test shortcut.

## Next: integration tests

After unit tests pass, read and follow `.cursor/skills/run-integration-tests/SKILL.md`.

If unit tests fail, stop. Do not start integration tests.
