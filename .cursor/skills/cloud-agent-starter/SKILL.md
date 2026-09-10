---
name: cloud-agent-starter
description: Minimal starter runbook for Cloud agents working in this Grafana repo. Use at the start of coding, testing, debugging, or review tasks when the agent needs practical setup, login, feature flag, run, or test workflow guidance.
---

# Cloud agent starter

## Use this first

1. Work from the repo root: `/workspace`.
2. Check existing terminal sessions before starting long-running servers.
3. Use the repo versions: Node from `.nvmrc`, Go from `go.mod`, and Yarn through Corepack.
4. Install frontend dependencies only when needed:

```sh
corepack enable
corepack install
yarn install --immutable
```

5. Start Grafana with SQLite defaults; no external database is needed for most tasks.

## Running the app

### Backend

Run the backend with hot reload:

```sh
make run
```

Wait for `HTTP Server Listen`, then smoke test:

```sh
curl -I http://localhost:3000/
```

Expected: a redirect to `/login`.

### Frontend

Run the frontend watcher in a separate terminal:

```sh
yarn start
```

Wait for `Compiled successfully` and type checking to finish. Open `http://localhost:3000/login`.

### Login

Use the default development account:

- Username: `admin`
- Password: `admin`

If prompted, skip or dismiss the password-change flow unless the test specifically requires it.

## Feature flags and mocks

### Backend feature toggles

Prefer config-driven toggles for manual testing. Start Grafana with:

```sh
GF_FEATURE_TOGGLES_ENABLE=featureOne,featureTwo make run
```

Disable a flag by leaving it out of the list. If the code uses generated feature toggle constants, run this after changing toggle definitions:

```sh
make gen-feature-toggles
```

### Frontend tests

Mock runtime config or feature toggles in the test setup closest to the component under test. Look for existing uses of `config.featureToggles`, `setPluginImportUtils`, or feature-specific test helpers before adding a new mock pattern.

### API and service mocks

Use existing mocks near the changed code first:

- Frontend: React Testing Library, MSW, RTK Query test helpers, or local `__mocks__`.
- Backend: service fakes and package-local test helpers.
- E2E: seed through public APIs or existing fixture helpers instead of database writes when possible.

## Testing workflows by area

### Backend Go services and APIs

Run the narrowest package test that executes the changed code:

```sh
go test -run TestName ./pkg/services/example/
```

For API-level changes, target the owning package first. Broaden only when shared behavior changes:

```sh
go test -run TestName ./pkg/api/
```

Use `make gen-go` after Wire dependency injection changes.

### Frontend React features

Run Jest once, never in watch mode:

```sh
yarn jest --no-watch path/to/file.test.tsx
```

For UI behavior, also run Grafana locally and test in the browser. Capture a walkthrough video for visible UI changes.

### Packages under `packages/`

Run the focused package test or build command used by nearby code. Start with:

```sh
yarn jest --no-watch packages/package-name
```

Run `yarn typecheck` when exported TypeScript types or package boundaries change.

### Built-in plugins

For plugin UI or query behavior, use the plugin workspace where available:

```sh
yarn workspace @grafana-plugins/plugin-name test
```

If a plugin has a dev build command, run it before manual browser testing:

```sh
yarn workspace @grafana-plugins/plugin-name dev
```

### Alerting

Read `public/app/features/alerting/unified/AGENTS.md` before changing alerting code. Use the local alerting test helpers and run the focused Jest or Go package tests for the touched area.

### Docs

Read `docs/AGENTS.md` before editing docs. For docs-only edits, validate formatting and links when the touched area has a local command; otherwise run:

```sh
git diff --check
```

### End-to-end checks

Use Playwright for full workflows that cross frontend, backend, auth, or provisioning boundaries:

```sh
yarn e2e:playwright path/to/test.spec.ts
```

Keep E2E runs focused. Prefer one scenario that proves the changed workflow over broad suites.

## Common Cloud workflow

1. Read the nearest `AGENTS.md` and existing tests for the area.
2. Define the success state before editing.
3. Start only the services needed to run the changed path.
4. Reproduce bugs before fixing when practical.
5. Commit and push before testing if the Cloud task requires a PR checkpoint.
6. Test the changed path end to end, then broaden tests based on blast radius.
7. Remove temporary logs, hard-coded flags, and debugging hooks before the final commit.

## Updating this skill

When you discover a useful run command, feature flag trick, fixture setup, flaky-test workaround, or manual testing runbook:

1. Add it to the most specific area in this skill.
2. Keep it actionable: include the command, when to use it, and the expected signal.
3. Avoid stale detail: link to nearby source or `AGENTS.md` guidance when behavior changes often.
4. Commit the skill update with the code change that proved the new knowledge.
