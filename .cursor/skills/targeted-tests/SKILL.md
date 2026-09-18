---
name: targeted-tests
description: Choose and run focused Grafana test commands. Use when the user asks to test a change, reproduce a failure, run unit tests, or verify frontend, backend, or Playwright behavior.
---

# Targeted Tests

## Instructions

1. Inspect the changed files and pick the narrowest useful test.
2. Prefer one-shot commands that exit cleanly in agent environments.
3. If a targeted run fails, diagnose that failure before broadening the test scope.

## Commands

### Backend Go

```sh
go test -run TestName ./pkg/services/myservice/
```

Use the package containing the touched code. For large packages such as `pkg/api/`, prefer a specific `-run` pattern.

### Frontend Jest

```sh
yarn jest --no-watch path/to/file.test.tsx
```

Do not use `yarn test` without `--watchAll=false`; it can stay in watch mode.

### Playwright E2E

```sh
yarn e2e:playwright path/to/test.spec.ts
```

For alerting and dashboard layout specs, read the local `AGENTS.md` first because those suites have additional setup and selector rules.

## Escalation

- If codegen files changed, use the `codegen-change` skill before testing.
- If integration databases are required, use `make devenv sources=postgres_tests,mysql_tests` only when the test package actually needs them.
