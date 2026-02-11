---
name: run-unit-tests
description: Run unit tests for Grafana frontend (Jest) and backend (Go). Use when the user asks to run tests, check if tests pass, test a specific file or package, or verify changes with tests.
---

# Run Unit Tests

## Frontend Tests (Jest)

Run JavaScript/TypeScript tests using Jest.

### Commands

| Command | Purpose |
|---------|---------|
| `yarn test <path>` | Run tests for specific file (watch mode) |
| `yarn test --no-watch <path>` | Run tests without watch mode |
| `yarn test:ci` | Run all tests in CI mode |

### Run Tests for Specific Files

```bash
# Single file
yarn test --no-watch public/app/features/dashboard/Dashboard.test.tsx

# Pattern matching
yarn test --no-watch --testPathPattern=dashboard

# Specific test name
yarn test --no-watch --testNamePattern="renders correctly"
```

### Test File Naming

Tests must be named `*.test.ts`, `*.test.tsx`, `*.test.js`, or `*.test.jsx`.

---

## Backend Tests (Go)

Run Go tests using Make or `go test` directly.

### Commands

| Command | Purpose |
|---------|---------|
| `make test-go-unit` | Run all unit tests |
| `go test -v ./pkg/path/...` | Run tests for specific package |
| `go test -v ./pkg/path -run TestName` | Run specific test function |

### Run Tests for Specific Packages

```bash
# Single package
go test -v ./pkg/services/mysvc

# All packages under a path
go test -v ./pkg/services/...

# Specific test function
go test -v ./pkg/services/mysvc -run TestFunctionName

# With race detection
go test -v -race ./pkg/services/mysvc
```

### Integration Tests

Integration tests require additional setup and use the `TestIntegration` prefix.

```bash
# Run integration tests (requires devenv)
make test-go-integration

# Database-specific (requires devenv setup first)
make test-go-integration-postgres
make test-go-integration-mysql
```

---

## Quick Reference

**Frontend:**
- Config: `jest.config.js`
- Timeout: 30 seconds
- Watch mode is default; use `--no-watch` to disable

**Backend:**
- Use `-short` flag for unit tests only (skips long-running tests)
- Use `-v` for verbose output
- Default timeout: 30 minutes
