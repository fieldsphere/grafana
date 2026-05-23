---
name: run-integration-tests
description: Runs Grafana backend integration tests with the smallest relevant scope after unit tests pass. Use when the user asks to run integration tests, API integration coverage, database-backed validation, or broader backend validation after unit tests.
---

# Run integration tests

## Instructions

When asked to run integration tests, **execute them with the Shell tool** from the repo root (`grafana/`). Do not ask the user to run commands. Start with the smallest relevant integration scope.

Consult `.cursor/rules/test-directory-map.mdc` before choosing scope.

**Do not use `-short`** — integration tests skip when `-short` is set (`testutil.SkipIntegrationTestInShortMode`).

**Do not run Playwright/e2e tests** (`yarn e2e*`) unless the user explicitly asks for end-to-end tests.

## Sequence requirement

1. Run unit tests first by following `.cursor/skills/run-unit-tests/SKILL.md`.
2. Only continue if unit tests pass, unless the user explicitly asks to skip unit tests.

## Test discovery

Integration tests are Go tests named `TestIntegration*`. Find them by:

1. Mapping changed files to a package or area.
2. Searching for `*_test.go` files with `func TestIntegration` in that area.
3. Checking dedicated suites under `pkg/tests/`.

| Changed area                                     | Integration test location                                       |
| ------------------------------------------------ | --------------------------------------------------------------- |
| K8s-style APIs (`apps/*`, `pkg/registry/apis/*`) | `pkg/tests/apis/<area>/...`                                     |
| Legacy HTTP APIs                                 | `pkg/tests/api/<area>/...`                                      |
| Web/UI server rendering                          | `pkg/tests/web/...`                                             |
| Alertmanager                                     | `pkg/tests/alertmanager/...`                                    |
| Service/store logic with DB                      | Same package `*_test.go` with `TestIntegration*`                |
| Datasource backends                              | `pkg/tsdb/<datasource>/...` or `pkg/tests/api/<datasource>/...` |

## Preferred commands

Run from repo root. Always include `-count=1` for integration runs.

**Targeted K8s API package:**

```sh
go test -v -count=1 ./pkg/tests/apis/provisioning/...
```

**Targeted legacy API package:**

```sh
go test -v -count=1 ./pkg/tests/api/alerting/...
```

**Single test function:**

```sh
go test -v -count=1 ./pkg/tests/apis/provisioning/... -run TestIntegrationProvisioning_Export
```

**In-package integration test** (outside `pkg/tests/`):

```sh
go test -v -count=1 ./pkg/services/ngalert/... -run ^TestIntegration
```

**Web integration:**

```sh
go test -v -count=1 ./pkg/tests/web/...
```

## Database and infrastructure variants

Some suites need external services. Use Makefile targets that start devenv containers:

| Target                                          | When to use                         |
| ----------------------------------------------- | ----------------------------------- |
| `make test-go-integration-postgres`             | Postgres-specific integration tests |
| `make test-go-integration-mysql`                | MySQL-specific integration tests    |
| `make test-go-integration-redis`                | Redis cache integration tests       |
| `make test-go-integration-memcached`            | Memcached cache integration tests   |
| `make test-go-integration-alertmanager`         | Remote alertmanager integration     |
| `make test-go-integration-grafana-alertmanager` | Grafana alertmanager integration    |

For targeted runs against postgres/mysql, start devenv first (`make devenv-postgres` or `make devenv-mysql`), then run the scoped `go test` command.

## Special mapping

- `pkg/registry/apis/provisioning/jobs/export/all.go`:
  1. Unit tests in `pkg/registry/apis/provisioning/jobs/export/`
  2. Integration test `pkg/tests/apis/provisioning/exportjob_test.go`

## Escalation order

Only escalate when targeted runs pass or are insufficient:

1. Single test or package under `pkg/tests/<area>/...`
2. Broader package: `./pkg/tests/apis/...` or `./pkg/tests/api/...`
3. Full backend integration: `make test-go-integration`

## After running

Report pass/fail, failing test names, and relevant error output. Integration tests spin up Grafana via `pkg/tests/testinfra` and may take longer than unit tests.

## Examples

Provisioning export job:

```sh
go test -v -count=1 ./pkg/tests/apis/provisioning/... -run TestIntegrationProvisioning_Export
```

Folder API:

```sh
go test -v -count=1 ./pkg/tests/apis/folder/...
```

Alerting API:

```sh
go test -v -count=1 ./pkg/tests/api/alerting/... -run TestIntegration
```

Service-level integration:

```sh
go test -v -count=1 ./pkg/services/sqlstore/... -run ^TestIntegration
```
