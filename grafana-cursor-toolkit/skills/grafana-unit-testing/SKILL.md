---
name: grafana-unit-testing
description: Runs and authors unit tests in this Grafana repo—Jest for frontend (public/app, packages), go test -short for backend (pkg, apps), decoupled plugin Jest, and Makefile helpers. Use when writing or running unit tests, choosing test commands, or debugging test failures—not for database-backed or TestIntegration suites.
---

# Grafana unit testing

## Scope

- **Unit tests**: Fast, isolated tests (Jest; Go with `-short` where applicable).
- **Not unit**: Backend tests under `pkg/tests/**` that need DB/services, or `-run ^TestIntegration`, are integration-style—use the smallest integration target or `make test-go-integration*` when appropriate. For integration workflows and `make test-ci-sequential`, see [grafana-integration-testing](../grafana-integration-testing/SKILL.md).

For a **directory map** (frontend vs plugin vs backend vs integration), follow `rules/test-directory-map.mdc`.

## Frontend (Jest)

### Where tests live

- Root Jest covers `public/app/`, `public/test/`, `packages/`, `scripts/tests/` (see repo `jest.config.js`).
- Test file naming: `*.test.ts` / `*.test.tsx` (not `*.spec` at repo root).
- **Decoupled datasource plugins** under `public/app/plugins/datasource/*` are **excluded** from root Jest; they use a local `jest.config.js` and often `package.json`—run tests **from that plugin directory** (e.g. `yarn test:ci`), not root `yarn test:ci` for those paths.

### Commands

- **Single file / tight scope (CI-style)**: `yarn test:ci --runTestsByPath <path-to-test-file>`
- **Watch locally**: `yarn test` (from repo root)
- **Shared packages (Nx)**: `yarn packages:test:ci` runs `test:ci` for packages tagged `scope:package`

### Stack and helpers

- **@testing-library/react**, **@testing-library/user-event** (prefer `userEvent.setup()`; async `await` on user actions).
- **Queries**: Prefer `*ByRole`; use labels for `Select` (see style guide).
- **App-wide render helpers**: `public/test/test-utils.tsx` (Redux, Grafana context, router, etc.).
- **Custom matchers**: `@grafana/test-utils` (extended in `public/test/setupTests.ts`).
- **Console**: In CI / when `frontend_dev_fail_tests_on_console` is set, `jest-fail-on-console` fails tests on stray `console` output—avoid noisy logs in tests.

### Deep dives

For Select/async backend mocks and patterns, refer to [contribute/style-guides/testing.md](contribute/style-guides/testing.md).

## Backend (Go)

### Where tests live

- Co-located `*_test.go` in the package under `pkg/**` or `apps/**`.
- Prefer **package-scoped** runs over the full tree when iterating.

### Commands

- **Targeted (preferred for unit)**:

  ```bash
  go test -v -short ./path/to/package
  ```

- **Full backend unit suite** (sharded Makefile): `make test-go-unit` (uses `-short`, `-timeout=30m`).
- **Prettier JSON output for a path** (requires `tparse`): `make test-go-unit-pretty FILES=./pkg/services/myservice`

### `all.go` changes

If you touch an `all.go` wire/aggregator file, check the same package for tests and related suites under `pkg/tests/**` when behavior spans registration (see test-directory-map rule for the provisioning export example).

## Checklist when adding tests

- [ ] Frontend: file matches `*.test.tsx` and lives under a root Jest root, **or** under a decoupled plugin with its local Jest run.
- [ ] Frontend: interactions use `userEvent` from a `setup()` pattern; avoid `fireEvent` unless necessary.
- [ ] Backend: use `-short` for tests meant to skip integration work if the package distinguishes them.
- [ ] No spurious `console.*` in frontend tests when CI fail-on-console applies.
