---
name: run-tests
description: Run backend, frontend, or E2E tests for the Grafana repo. Use when the user asks to run tests, execute tests, or verify code with tests.
---

# Run Tests

## Instructions

When the user wants to run tests, use the appropriate command below. Run from the repo root.

### Backend (Go)

```bash
# Single test
go test -run TestName ./pkg/services/myservice/

# All unit tests
make test-go-unit

# Integration tests
make test-go-integration
```

### Frontend (Jest)

```bash
# Single file
yarn jest path/to/file --no-watch

# By name pattern
yarn jest -t "pattern" --no-watch

# Update snapshots
yarn jest path/to/file -u --no-watch
```

### E2E (Playwright)

```bash
yarn e2e:playwright path/to/test.spec.ts
```

## Notes

- Use `--no-watch` for Jest so tests run once and exit.
- For targeted backend tests, replace `TestName` and `./pkg/services/myservice/` with the actual test and package path.
