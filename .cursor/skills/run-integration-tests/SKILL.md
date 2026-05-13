---
name: run-integration-tests
description: Runs Grafana integration tests with the smallest relevant scope and only after unit-test validation. Use when the user asks to run integration tests, API integration coverage, or broader validation after unit tests pass.
disable-model-invocation: true
---

# Run integration tests

## Instructions

When asked to run integration tests, always run them after unit tests have passed. Start with the smallest relevant integration scope.

## Sequence requirement

1. Run the unit-test workflow first from `.cursor/skills/run-unit-tests/SKILL.md`.
2. Only continue to integration testing if unit tests pass, unless the user explicitly asks to skip unit tests.

## Integration scope selection

1. Map changed backend/API areas to the smallest matching integration package under `pkg/tests/`.
2. Prefer package-targeted integration runs before broader commands.
3. Avoid full integration suites unless targeted coverage is not sufficient.

## Preferred commands

- Targeted API/provisioning integration package:

```sh
go test -v ./pkg/tests/apis/...
```

- Targeted API integration package:

```sh
go test -v ./pkg/tests/api/...
```

- Specific integration test file or test name when practical:

```sh
go test -v ./pkg/tests/apis/... -run <TEST_NAME_REGEX>
```

## Special mapping

- For changes around `pkg/registry/apis/provisioning/jobs/export/all.go`, include:
  - Unit tests in `pkg/registry/apis/provisioning/jobs/export/` first
  - Integration test `pkg/tests/apis/provisioning/exportjob_test.go` next

## Escalation order

1. Targeted integration package or test-name runs
2. Broader integration package runs across `pkg/tests/api/...` or `pkg/tests/apis/...`
3. Full integration commands only when explicitly required
