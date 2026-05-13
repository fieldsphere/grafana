---
name: run-unit-tests
description: Runs Grafana unit tests with the smallest relevant scope across frontend Jest and backend Go packages. Use when the user asks to run unit tests, validate changes, or choose the right test command for modified files.
---

# Run unit tests

## Instructions

When asked to run tests, pick the smallest command that validates the change set. Do not default to full-suite runs.

## Scope selection

1. Map changed files to one of these buckets:
   - Frontend app/package tests (`public/app/**`, `packages/**`)
   - Plugin-local datasource tests (`public/app/plugins/datasource/*`)
   - Backend unit tests (`pkg/**`, `apps/**`)
2. Run only unit tests unless the user explicitly asks for integration or end-to-end tests.

## Frontend unit tests

- For files under `public/app/**` and shared packages covered by root Jest, run targeted root Jest:

```sh
yarn test:ci --runTestsByPath <TEST_FILE_PATH>
```

- If only source files changed and no explicit test file is given, use related-tests mode:

```sh
yarn test:ci --findRelatedTests <SOURCE_FILE_PATH>
```

- For decoupled datasource plugins in `public/app/plugins/datasource/*` that have local test config (`package.json` and/or `jest.config.js`), run tests from that plugin directory:

```sh
yarn test:ci
```

## Backend unit tests

- Prefer package-targeted unit tests over repository-wide runs:

```sh
go test -v -short <GO_PACKAGE>
```

- Derive `<GO_PACKAGE>` from changed files, such as:
  - `./pkg/services/ngalert/...`
  - `./pkg/registry/apis/provisioning/jobs/export/...`
  - `./apps/live/...`

- If needed for faster iteration, narrow further with `-run`:

```sh
go test -v -short <GO_PACKAGE> -run <TEST_NAME_REGEX>
```

## Special mapping

- Treat `all.go` files as production code. For `pkg/registry/apis/provisioning/jobs/export/all.go`, run:
  - Unit tests in `pkg/registry/apis/provisioning/jobs/export/`
  - Related integration coverage in `pkg/tests/apis/provisioning/exportjob_test.go` if explicitly requested

## Escalation order

1. Targeted file-level frontend or package-level backend tests
2. Plugin-local `yarn test:ci` for datasource plugins
3. Broader repo test commands only if targeted runs are not sufficient

## Integration handoff

- If integration validation is requested after unit tests pass, continue with `.cursor/skills/run-integration-tests/SKILL.md`.

## Examples

- Frontend single file:

```sh
yarn test:ci --runTestsByPath public/app/features/dashboard/components/DashboardScene.test.tsx
```

- Backend package:

```sh
go test -v -short ./pkg/services/authn/...
```
