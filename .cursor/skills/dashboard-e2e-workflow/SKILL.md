---
name: dashboard-e2e-workflow
description: Work on Grafana dashboard Playwright E2E specs and page objects. Use when editing e2e-playwright/dashboard-new-layouts or migrating dashboard specs to page-object patterns.
---

# Dashboard E2E Workflow

## Instructions

1. Read `e2e-playwright/dashboard-new-layouts/AGENTS.md` before editing tests.
2. Prefer page objects for repeated dashboard interactions.
3. Do not invent speculative page-object methods; add only what the current spec needs.
4. Use stable selectors and realistic resource names.
5. Verify the changed spec with a focused Playwright run.

## Default commands

```sh
yarn e2e:pw --project dashboard-new-layouts --grep "spec or test title"
```

For flaky-prone migration work:

```sh
yarn e2e:pw --project dashboard-new-layouts --repeat-each=3 --grep "spec or test title"
```

## Demo angle

This skill is a good Cursor 101 example because a parent agent can keep context on the feature request while a subagent migrates one E2E interaction into a reusable page object.
