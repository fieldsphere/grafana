# Angular Panel Migration Scope Gate

This document confirms scope for the legacy Angular panel JSON to dashboard schema v2 migration work tracked in CUR-related efforts and `.cursor/docs/angular-v2-react-migration-status.md`.

## In scope

- Legacy Angular panel types stored in dashboard JSON (v0/v1 schema versions).
- Panel type conversion and `__angularMigration` metadata during v1 to v2 conversion.
- Frontend scene loading that extracts `__angularMigration`, runs React panel migration handlers, and strips migration metadata from runtime options.
- Go and TypeScript parity for migration target selection and `originalOptions` extraction.
- Panel-family fixtures and tests under:
  - `apps/dashboard/pkg/migration/`
  - `public/app/features/dashboard/api/ResponseTransformers.ts`
  - `public/app/features/dashboard-scene/serialization/`
  - `public/app/plugins/panel/*/migrations*.test.ts`

## Out of scope

- Unified-storage `/api` to `/apis` resource migration (folders, playlists, provisioning, search routing). That track is documented separately in `.cursor/docs/api-to-api-migration-status.md` when present.
- Backend API changes unrelated to dashboard schema conversion.
- New panel plugins or datasource query functions.
- Running dev servers unless explicitly requested for demo artifacts.

## Two-track separation

| Track | Purpose | Primary code |
| --- | --- | --- |
| Angular panel to React/v2 | Convert deprecated panel types and preserve Angular options for handler migration | `apps/dashboard/pkg/migration/conversion/`, `public/app/features/dashboard-scene/serialization/angularMigration.ts` |
| `/api` to `/apis` unified storage | Move Grafana resources to app-platform APIs | `pkg/storage/unified/`, registry APIs |

Changes in this effort must not conflate the two tracks in status docs or PR descriptions.

## Acceptance for scope gate

- [x] Work targets legacy Angular panel JSON and dashboard schema v2 conversion only.
- [x] No unified-storage routing or resource handler changes unless a dashboard conversion bug requires it.
- [x] Status and handoff live in `.cursor/docs/angular-v2-react-migration-status.md`.
