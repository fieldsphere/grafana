---
name: playwright-e2e-feature-lab
description: Runs end-to-end Playwright MCP tests for the Feature Lab feature. Use when verifying Feature Lab UI behavior, testing feature flag toggling, sidebar navigation, or validating the Feature Lab page renders correctly.
---

# Feature Lab E2E Testing via Playwright MCP

## Prerequisites

The Playwright MCP server must be connected. Check with `GetMcpTools` for a server named `playwright` or `Playwright`. If unavailable, ask the user to add `@playwright/mcp` to their MCP settings.

## Playwright MCP Tools

Use `CallMcpTool` with the Playwright server. Key tools:

| Tool | Purpose |
|------|---------|
| `browser_navigate` | Navigate to a URL |
| `browser_click` | Click an element (by text, selector, or coordinates) |
| `browser_type` | Type text into an input |
| `browser_snapshot` | Get current page accessibility snapshot |
| `browser_take_screenshot` | Capture a screenshot |
| `browser_wait_for_selector` | Wait for an element to appear |

## Test Workflow

### Step 1: Verify Dev Server

Before testing, confirm Grafana is running:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login
```

Expected: `200`. If not running, start backend (`make run`) and frontend (`yarn start`).

### Step 2: Login

```
browser_navigate → http://localhost:3000/login
browser_type → username field: "admin"
browser_type → password field: "admin"
browser_click → "Log in" button
```

If prompted to change password, click "Skip".

### Step 3: Navigate to Feature Lab

```
browser_click → "Feature Lab" in sidebar
browser_wait_for_selector → table element
browser_take_screenshot → capture page state
```

### Step 4: Run Test Scenarios

Execute these scenarios in order, taking screenshots at key assertions:

**Scenario A: Page loads correctly**
- Verify page title "Feature Lab" is present
- Verify "Runtime only" info alert is visible
- Verify table has columns: Flag, Description, Stage, Enabled
- Verify at least one feature flag row exists

**Scenario B: Search filtering**
```
browser_type → search input: "alerting"
```
- Verify table only shows flags containing "alerting"
- Clear the search input
- Verify all flags reappear

**Scenario C: Toggle a feature flag**
```
browser_click → any toggle switch in the Enabled column
```
- Verify success toast "Feature toggle updated" appears
- Take screenshot of updated state

**Scenario D: API verification**
After toggling, confirm the API reflects the change:
```bash
curl -s http://localhost:3000/api/featuremgmt/features \
  -H "Authorization: Basic YWRtaW46YWRtaW4=" | \
  python3 -c "import json,sys; flags=json.load(sys.stdin); print([f for f in flags if f['name']=='<toggled_flag>'])"
```

## Reporting Results

After all scenarios, report:

```
E2E Results:
- [PASS/FAIL] Page loads with correct layout
- [PASS/FAIL] Search filters flags
- [PASS/FAIL] Toggle updates flag state
- [PASS/FAIL] API reflects toggled state
```

Include screenshots for any failures.

## Key Selectors

| Element | Selector Strategy |
|---------|-------------------|
| Search input | placeholder="Search feature flags..." |
| Feature flag table | role="table" |
| Toggle switches | role="switch" within Enabled column |
| Info alert | text="Runtime only" |
| Sidebar entry | text="Feature Lab" |

## Troubleshooting

- **500 on page load**: Frontend not compiled. Check `yarn start` is running.
- **403 on API calls**: User lacks admin permissions. Log in as `admin`.
- **Empty table**: Backend may not have `FeatureManager` type (enterprise build). Check API response directly.
- **Playwright MCP not found**: User must add `@playwright/mcp` server to Cursor MCP settings.
