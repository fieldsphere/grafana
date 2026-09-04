---
name: run-integration-tests
description: Run Grafana backend TestIntegration tests (SQLite by default; Postgres/MySQL via devenv) after unit tests pass. Use when the user asks to run integration tests, TestIntegration, make test-go-integration, or to continue testing after unit tests.
---

# Run integration tests

Run existing integration tests. This skill starts after unit tests from `.cursor/skills/run-unit-tests/SKILL.md` have passed.

Execute commands with the Shell tool. Do not ask the user to run them.

## Prerequisite

If `.cursor/skills/run-unit-tests/SKILL.md` has not been run in this session, follow that skill first. If those unit tests failed, stop.

Playwright (`yarn e2e:playwright`) is E2E, not this skill.

## What counts as an integration test

Backend tests must be named `TestIntegration*` and call `testutil.SkipIntegrationTestInShortMode(t)`. That is why `go test -short` skips them and `make test-go-unit` is not enough.

Do not use `-short` here. Use `-count=1` so results are not cached.

## Scope

Do not run the full integration suite unless the user asks. Target the packages they named or the packages changed after unit tests.

Default database is embedded SQLite. No Docker required.

```sh
go test -count=1 -run '^TestIntegration' ./pkg/services/myservice/
```

A single test:

```sh
go test -count=1 -run '^TestIntegrationFoo$' ./pkg/services/myservice/
```

Server / API / k8s suites live under `pkg/tests/` (shared Grafana process per package). Same `-run '^TestIntegration'` rule.

## Full backend suite

Only when the user asks for the whole suite. 5m timeout, sharded with `SHARD`/`SHARDS`:

```sh
make test-go-integration
```

Equivalent unscoped form:

```sh
go test -count=1 -run '^TestIntegration' -covermode=atomic ./pkg/...
```

## Other databases

Postgres and MySQL need devenv containers first (`make devenv sources=postgres_tests,mysql_tests` or the targets below). Skip these unless the user asked for that database or the change is SQL/migration-specific.

```sh
make test-go-integration-postgres
make test-go-integration-mysql
```

Cache backends (only if the change touches that cache):

```sh
make test-go-integration-redis
make test-go-integration-memcached
```

Alertmanager extras (only if the change is in those packages):

```sh
make test-go-integration-alertmanager
make test-go-integration-grafana-alertmanager
```

## Frontend scenarios

Alerting (and similar) `*.test.scenario.ts` files are frontend integration tests. They still run through Jest, not `make test-go-integration`:

```sh
yarn jest --no-watch path/to/File.test.scenario.ts
```

Use a login shell (`bash -lc` or tmux) so Node is the pinned version from `.nvmrc`.

## Notes

- Integration tests that hit the database must define `TestMain` so test DBs are cleaned up.
- `make test` runs unit + integration + frontend. Do not use it as an integration-test shortcut.
- First compile of `pkg/api/` or `pkg/tests/` is slow (~2 min) because of the dependency graph.
