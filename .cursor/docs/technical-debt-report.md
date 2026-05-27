# Grafana repository technical debt report

**Date:** 2026-05-20  
**Scope:** Evidence-based scan of `/workspace` (Grafana monorepo). Method: repository-wide search for markers, contributor architecture docs, squad-maintained debt lists, and a read-only code-explorer pass (Cursor explore subagent).

## Executive summary

Debt clusters into five themes: (1) **platform migration** from legacy HTTP APIs and SQL patterns toward Kubernetes-style resource APIs and unified storage; (2) **dashboard** migration and scenes serialization complexity; (3) **unified alerting** across `pkg/services/ngalert` and `public/app/features/alerting/unified`; (4) **legacy frontend** surface (Angular-related SASS, deprecated UI packages, legacy API clients); (5) **test and typing hygiene** (skipped or flaky tests, dense `eslint-disable` / `@ts-expect-error` in migration and TraceView code).

## 1. Comment and marker density (TODO / FIXME / HACK / XXX)

Rough distribution by top-level tree (files containing at least one marker):

| Area | Approx. files with markers | Severity |
|------|---------------------------|----------|
| `pkg/` | 340+ | High |
| `public/app/` | 260+ | High |
| `packages/` | 130+ | Medium |
| `apps/` | 90+ | Medium |

Notable hotspots:

- **`pkg/services/ngalert/`** — many files under `state/`, `notifier/`, `api/compat/`, `remote/` (alerting migration and compatibility).
- **`pkg/registry/apis/`** — provisioning and dual-write paths (`resources/dualwriter.go`, parsers, routes).
- **`pkg/services/team/teamimpl/team.go`** — repeated `TODO` stubs for Kubernetes team service enablement (IAM migration).
- **`pkg/services/org/orgimpl/org.go`** — multiple `TODO` notes to refactor toward store CRUD.
- **`public/app/features/alerting/unified/`** — large footprint; see also squad `TODO.md`.
- **`public/app/features/dashboard-scene/`** — serialization and schema migration markers.
- **`packages/grafana-schema/`** — generated/CUE-heavy files include many markers (noise vs. product debt: treat separately).

## 2. Documented migrations and legacy architecture

Authoritative narrative lives under `contribute/` and `docs/sources/breaking-changes/`:

| Topic | Reference | Severity |
|-------|-----------|----------|
| Legacy `/api/...` vs resource `/apis/...` | `contribute/architecture/k8s-inspired-backend-arch.md` | High |
| Legacy package layout (`pkg/models`, sqlstore handlers) | `contribute/backend/package-hierarchy.md` | High |
| sqlstore handlers deprecated | `contribute/backend/database.md` | High |
| SASS deprecated in favor of Emotion | `contribute/style-guides/frontend.md` | Medium |
| Formal deprecation policy | `contribute/deprecation-policy.md` | Medium |
| User-facing removals | `docs/sources/breaking-changes/` | High |

In-code legacy surfaces (non-exhaustive):

- `pkg/registry/apis/iam/legacy/` and related `legacy_search` paths.
- `pkg/storage/legacysql/dualwrite/dualwriter.go` — SQL versus unified storage dual-write.
- `public/app/api/clients/legacy/index.ts` and generated `packages/grafana-api-clients/.../legacy/`.
- `packages/grafana-ui/src/graveyard/` — deprecated components slated for removal.
- `packages/grafana-ui/src/components/Forms/Legacy/`.
- `public/sass/_angular.scss` — large Angular-era stylesheet; removal blocked on Angular retirement.
- `public/app/features/templating/LegacyVariableWrapper.ts`.

## 3. Large or high-complexity modules

| Path | Notes | Severity |
|------|-------|----------|
| `public/sass/_angular.scss` | Very large; Angular-only styling | High |
| `public/app/features/dashboard/state/DashboardMigrator.ts` | Dashboard version migration | High |
| `public/app/features/dashboard/state/DashboardMigrator.test.ts` | Large test file; many suppressions | High |
| `public/app/features/dashboard/state/DashboardModel.ts` | Core dashboard model | Medium |
| `pkg/storage/legacysql/dualwrite/dualwriter.go` | Dual-write orchestration | High |
| `pkg/services/ngalert/state/manager.go` | Alert state management | Medium |

## 4. Skipped and flaky tests

### Go (`t.Skip` with explicit flaky or debt comments)

Examples (not exhaustive):

- `pkg/services/ngalert/notifier/redis_channel_test.go` — skip + TODO flaky (GitHub #94037 cited in comment).
- `pkg/services/store/service_test.go` — golden JSON frame test skipped as flaky.
- `pkg/services/libraryelements/libraryelements_permissions_test.go` — flaky skip (#120712).
- `pkg/tests/apis/shorturl/shorturl_test.go` — redirect tests skipped as flaky.
- `pkg/tests/apis/folder/folders_test.go` — multiple skips (continue token / flaky).
- `pkg/tests/apis/iam/team_binding_integration_test.go` — flaky context cancellation.
- `pkg/tests/api/influxdb/influxdb_test.go`, `pkg/tests/api/correlations/correlations_update_test.go` — flaky skips.
- `pkg/infra/filestorage/fs_integration_test.go`, `pkg/server/search_server_distributor_test.go`, `pkg/tsdb/loki/scopes_test.go` — explicit flake skips.

Many other `t.Skip` calls are conditional on missing integration dependencies (Redis, cloud credentials, databases); those are lower debt.

### Frontend

- `public/app/features/alerting/unified/RuleList.test.tsx`, `NotificationPoliciesPage.test.tsx`, and others — `describe.skip` / `it.skip`.
- `public/app/features/alerting/unified/TODO.md` — tracks re-enabling skipped tests in `NotificationPolicies.test.tsx`.
- `packages/grafana-ui/src/components/AutoSaveField/AutoSaveField.test.tsx` — multiple skips.
- `public/app/features/dashboard/api/v1.test.ts` — skips.

### E2E

- `e2e-playwright/various-suite/bookmarks.spec.ts` — serial mode due to flake when parallel.

## 5. Lint and TypeScript suppressions

Repository scale: hundreds of files contain `eslint-disable` and/or `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`.

Dense examples:

- `public/app/features/dashboard/state/DashboardMigrator.test.ts` — many `@ts-expect-error`.
- `public/app/features/dashboard-scene/scene/DashboardLayoutOrchestrator.test.ts` — high suppression count.
- `public/app/features/explore/TraceView/` — Jaeger-derived types and UI drive `eslint-disable` and TS suppressions.

## 6. Dependency and tooling friction

- **`go.mod`:** Go **1.25.9**; multiple `+incompatible` modules; several `replace()` directives document forks or pins (SAML, Docker/moby, MySQL server fork, kin-openapi, mysql driver lock). Each increases upgrade and security-patch cost.
- **`package.json`:** `resolutions` force specific versions or patches (`history`, `react-split-pane`, `slate-dev-environment`, Storybook patch, `debug`, GitHub-sourced forks). Indicates upstream incompatibility or incident response debt.

## 7. Squad-maintained debt registers

- `public/app/features/alerting/unified/TODO.md` — small refactors, UI polish, re-enable tests.
- `public/app/features/alerting/unified/AGENTS.md` — Redux Toolkit marked legacy vs RTK Query; `enhanceEndpoints` overrides need TODO until codegen catches up.

## 8. Severity matrix (remediation targets)

| Theme | Severity | Primary locations |
|-------|----------|-------------------|
| Legacy API / K8s-style migration | High | `pkg/registry/apis/`, `pkg/storage/legacysql/dualwrite/`, `public/app/api/clients/legacy/` |
| Dashboard migration / scenes | High | `public/app/features/dashboard/state/`, `public/app/features/dashboard-scene/` |
| Alerting (FE + BE) | High | `pkg/services/ngalert/`, `public/app/features/alerting/unified/` |
| Angular / SASS / graveyard UI | High | `public/sass/_angular.scss`, `packages/grafana-ui/src/graveyard/` |
| Flaky / skipped tests | Medium | ngalert, folder/shorturl/iam API tests, alerting FE tests |
| Lint / TS suppressions | Medium | Dashboard migrator, dashboard-scene, TraceView |
| go.mod / package resolutions | Medium | `go.mod` replace block, `package.json` resolutions |

## 9. Confluence and Jira (this environment)

**Confluence:** No Atlassian site URL, API user, or API token is configured in this workspace. The canonical report for upload is this file: `.cursor/docs/technical-debt-report.md`. Paste into a Confluence page (Markdown macro or import), or attach the file.

**Jira:** No Jira Cloud URL, project key, or API credentials are available here, so issues cannot be created or labeled automatically.

**Suggested Jira work items** (apply label `tech-debt` or your team equivalent; link each to paths above):

1. Reduce dual-write and legacy SQL surface in unified storage migration (`pkg/storage/legacysql/dualwrite/`).
2. Complete Kubernetes-style IAM and team service migration (`pkg/services/team/teamimpl/`, `pkg/registry/apis/iam/`).
3. Dashboard migrator typing and test debt (`DashboardMigrator.ts` / `.test.ts`).
4. Dashboard scenes serialization suppressions (`dashboard-scene/serialization/`, `DashboardLayoutOrchestrator.test.ts`).
5. TraceView lint and type cleanup (`public/app/features/explore/TraceView/`).
6. Re-enable or rewrite flaky Go integration tests (folder, shorturl, iam team binding, correlations, ngalert redis channel).
7. Re-enable alerting unified skipped tests per `TODO.md`.
8. Angular SASS removal plan (`public/sass/_angular.scss`) aligned with Angular removal.
9. Dependency upgrade program for `go.mod` replace pins and `package.json` resolutions (owners per comment in `go.mod`).

Companion file: `.cursor/docs/technical-debt-jira-stubs.csv` for bulk import tools.

## 10. Methodology

- Cursor **explore** subagent (code-explorer-style read-only pass) for structured hotspot catalog.
- `rg` counts and spot checks for `TODO|FIXME|HACK|XXX`, `eslint-disable`, `@ts-expect-error`, `t.Skip`, `it.skip`.
- Manual read of `public/app/features/alerting/unified/TODO.md` and `go.mod` header.

This report is a snapshot; counts change with every commit.
