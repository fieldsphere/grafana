---
name: end-to-end-labs-browser
description: Validate the Labs sidebar placement and Labs page behavior end-to-end using the browser after local dev servers are running.
---

# End-to-end Labs validation in browser

## When to use
Use this skill when the user asks for end-to-end validation of the Labs feature (sidebar placement, icon/badge styling, and Labs page behavior) in a live Grafana UI.

## Instructions

### 1) Preflight and server readiness
1. Check existing terminal sessions first to avoid duplicate long-running processes.
2. If backend and frontend are not both running, start them from repo root in separate sessions:
   - `make run`
   - `yarn start`
3. If frontend startup fails due missing module/state file, run:
   - `corepack enable`
   - `corepack install`
   - `yarn install --immutable`
   Then restart `yarn start`.
4. Confirm readiness before opening browser:
   - Backend logs include `HTTP Server Listen`
   - Frontend logs include `Compiled successfully`
   - `curl -I http://localhost:3000/` returns `HTTP/1.1 302` with `Location: /login`

### 2) Browser-driven end-to-end flow (@browser / computer use)
1. Open `http://localhost:3000/login`.
2. Sign in with `admin` / `admin` (update password only if prompted by the flow).
3. Validate sidebar behavior:
   - Labs appears between Connections and Administration.
   - Labs is not nested under the Connections collapsible children.
   - Labs icon is orange.
   - Labs has the `New` badge.
4. Click Labs and validate page behavior:
   - URL is `/labs` (not 404).
   - Feature flags list renders.
   - Search filters results.
   - Toggle interactions update status and do not break navigation.

### 3) Regression checks
1. Collapse and expand Connections; confirm Labs remains a sibling item.
2. Refresh page and verify Labs item still appears in the correct location.
3. If permissions are restricted in the session, confirm read-only alert appears and toggles are disabled.

## Expected outcome
- Labs is visible as a top-level sidebar item at the correct hierarchy.
- Labs icon is orange and badge styling is visible.
- Labs page loads and behaves correctly for the session permissions.

## Troubleshooting
- If `/labs` returns 404, frontend route bundle is likely not active; verify `yarn start` compiled successfully and backend is proxying frontend assets.
- If browser shows `chrome-error://chromewebdata/`, retry with `http://localhost:3000/login`.
