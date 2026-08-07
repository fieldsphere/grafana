---
name: alerting-test-workflow
description: Add or run Grafana alerting frontend tests using local squad conventions. Use for work under public/app/features/alerting/unified or alerting-related React tests.
---

# Alerting Test Workflow

## Instructions

1. Read `public/app/features/alerting/unified/AGENTS.md`.
2. If deeper test guidance is needed, read `public/app/features/alerting/unified/TESTING.md`.
3. Prefer existing factories, mock APIs, and MSW patterns over ad hoc `jest.fn()` mocks.
4. Keep RBAC and feature toggle defaults explicit in tests.
5. Run the narrowest test with Jest in non-watch mode.

## Default command

```sh
yarn jest --no-watch public/app/features/alerting/unified/path/to/file.test.tsx
```

## Review checklist

- Uses Testing Library queries that reflect user behavior.
- Keeps network mocking close to existing `mockApi.ts` patterns.
- Covers permission-sensitive behavior server-side or via documented RBAC fixtures.
- Avoids adding frontend dependencies unless the user explicitly requested them.
