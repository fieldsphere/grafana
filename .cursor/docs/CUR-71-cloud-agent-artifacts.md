# CUR-71 Cloud Agent Artifacts

## Source specification

Jira summary: `feature flags dashboard`

## Implementation

- Added a new top-level **Labs** navigation section with a **New** badge.
- Added a **Feature flags** Labs page that lists enabled feature flags.
- Added browser-local controls to disable or re-enable enabled flags during the current Grafana session.

## Verification

- `yarn jest --no-watch public/app/features/labs/FeatureFlagsPage.test.tsx`
- `go test ./pkg/services/navtree/... ./pkg/api -run TestBuildLabsNavLink`

## Attached artifacts

- Screenshot: `.cursor/artifacts/CUR-71-feature-flags-dashboard.png`
- Video: `.cursor/artifacts/CUR-71-feature-flags-dashboard.mp4`
