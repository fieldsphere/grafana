---
name: playwright-browser-e2e
description: Use Playwright's browser runner to execute Grafana end-to-end tests, debug failures, and collect actionable test evidence.
---

# Playwright browser end-to-end testing

## Instructions
When the user asks for end-to-end browser testing with Playwright, run these steps directly using the Shell tool.

### 1) Preflight
Run from the repo root:

```sh
corepack enable
yarn install --immutable
yarn playwright install chromium
```

If `yarn` reports a missing `node_modules` state file, rerun the preflight commands before testing.

### 2) Run Playwright tests in browser mode
Use the smallest scope that validates the requested behavior:

```sh
yarn e2e:playwright --ui
```

Useful targeted variants:

```sh
yarn e2e:playwright e2e-playwright/<path>/<test>.spec.ts
yarn e2e:playwright --grep "<test name>"
yarn e2e:playwright --grep @<tag>
yarn e2e:playwright --project <projectname>
```

To run against an already running Grafana instance:

```sh
GRAFANA_URL=http://localhost:3000 yarn e2e:playwright --grep "<test name>"
```

### 3) Debug failures
Use Playwright debug mode for interactive step-through and traces:

```sh
yarn e2e:playwright:debug
```

Then open the latest HTML report:

```sh
yarn playwright show-report
```

### 4) Report results
- Include the exact command run.
- Include pass/fail outcome and failing test names.
- If failures occur, include the rerun command with narrowed scope.
- Include report/trace location when available.

## Notes
- `yarn e2e:playwright` starts its own Grafana test server when `GRAFANA_URL` is not set.
- Do not run `yarn start` for this workflow unless the user explicitly asks for frontend watcher mode.
- Prefer Chromium for consistency with CI unless the user asks for another browser/project.
