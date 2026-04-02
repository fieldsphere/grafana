---
name: grafana-integration-testing
description: Runs and scopes backend integration tests (TestIntegration, pkg/tests, API suites) and optional DB/cache variants. Use when running or authoring integration tests, debugging TestIntegration failures, or chaining tests after unit runs—also when the user mentions make test-go-integration, sqlite/postgres/mysql integration, or sequential CI-style test runs.
---

# Grafana integration testing

## Scope

- **Backend integration**: Go tests matching `^TestIntegration` (see `make test-go-integration`), plus targeted suites under `pkg/tests/**`, `pkg/tests/api/`, `pkg/tests/apis/`.
- **Not this skill**: Playwright E2E (`yarn e2e:playwright`), Storybook tests, or pure Jest unit tests—use the unit-testing skill and repo Jest docs.

Follow `rules/test-directory-map.mdc` for where tests live.

## How the backend integration suite works

- **Discovery**: `scripts/ci/backend-tests/pkgs-with-tests-named.sh -b TestIntegration` lists packages that define `TestIntegration*`.
- **Sharding**: `SHARD` / `SHARDS` match CI (e.g. `SHARD=2/4 make test-go-integration`).
- **Default run**: `make test-go-integration` runs `go test -run '^TestIntegration'` over those packages (see `Makefile` for full flags, timeout, coverage).

## Makefile targets (common)

| Target | Purpose |
|--------|---------|
| `make test-go-integration` | Sqlite-oriented `TestIntegration` run (default local/CI parity). |
| `make test-go-integration-postgres` | Postgres (`devenv-postgres` first). |
| `make test-go-integration-mysql` | MySQL (`devenv-mysql` first). |
| `make test-go-integration-redis` / `memcached` | Cache integration subsets; env vars set in Makefile. |
| `make test-go-integration-alertmanager` | Remote alertmanager subset. |
| `make test-go-integration-grafana-alertmanager` | Grafana alertmanager images + `pkg/tests/alertmanager`. |

## Chaining with unit tests

**Backend-only (already sequential):** `make test-go` runs `test-go-unit` then `test-go-integration`.

**Full stack unit then integration (frontend Jest CI + backend unit + backend integration):**

```bash
make test-ci-sequential
```

Steps: `yarn test:ci` → `make test-go-unit` → `make test-go-integration`.

**Nx packages / decoupled plugins** (optional extra unit tiers): `yarn packages:test:ci`, `yarn plugin:test:ci`—not included in `test-ci-sequential`; run when those areas change.

## CI reference

- `.github/workflows/pr-test-integration.yml` — integration matrix (shards, DB tags).
- `.github/workflows/backend-unit-tests.yml` — Go `-short` unit sharding.

## Related

- Unit tests and Jest commands: [grafana-unit-testing](../grafana-unit-testing/SKILL.md).
