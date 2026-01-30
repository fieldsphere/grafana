---
name: run-unit-tests
description: Run unit tests for Grafana frontend (Jest) and backend (Go). Use when the user wants to run tests, execute unit tests, check test coverage, or verify code changes with tests.
---

# Running Unit Tests

## Quick Start

**Frontend tests:**
```bash
yarn test
```

**Backend tests:**
```bash
make test-go-unit
```

## Frontend Tests (Jest)

Frontend uses Jest for unit tests. Test files are named `.test.ts` or `.test.tsx`.

**Watch mode (default):**
```bash
yarn test
```
Runs tests in watch mode with notifications. Press `a` to run all tests, `f` to run only failed tests, or `q` to quit.

**CI mode (single run):**
```bash
yarn test:ci
```

**With coverage:**
```bash
yarn test:coverage
```

**Run specific test file:**
```bash
yarn test path/to/file.test.ts
```

## Backend Tests (Go)

Backend uses Go's built-in testing framework. Test files are named `*_test.go`.

**Run all unit tests:**
```bash
make test-go-unit
```

**Run tests for specific package:**
```bash
go test ./pkg/services/myservice/...
```

**Run tests with pretty output:**
```bash
make test-go-unit-pretty FILES=./pkg/services/myservice
```

**Run specific test function:**
```bash
go test -run TestFunctionName ./pkg/services/myservice
```

**Run with verbose output:**
```bash
go test -v ./pkg/services/myservice/...
```

## Running All Tests

To run both frontend and backend unit tests:
```bash
make test
```

This runs `test-go` (unit + integration) and `test-js` (frontend).

## Notes

- Frontend tests use Jest and support watch mode for faster development
- Backend tests use Go's standard testing framework
- Integration tests are separate from unit tests (`make test-go-integration`)
- Ensure dependencies are installed before running tests (`make deps` for backend, `yarn install` for frontend)
