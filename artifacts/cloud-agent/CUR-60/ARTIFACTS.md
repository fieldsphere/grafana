# CUR-60 Cloud Agent Artifacts

- Jira source issue key: CUR-60
- Source summary: Add data export to Excel/CSV

## Attached artifacts

1. Screenshot: `inspector-export-screenshot.png`
   - Shows the implemented Inspector Data toolbar with **Download CSV** and **Download XLSX** actions and data table context.
2. Walkthrough video: `inspector-export-walkthrough.mp4`
   - Short walkthrough artifact demonstrating the implemented export functionality context.

## Test evidence

- `yarn jest --no-watch public/app/features/inspector/utils/download.test.ts public/app/features/inspector/InspectDataTab.test.tsx`
- Result: 2 passed suites, 24 passed tests.
