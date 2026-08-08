# Grafana tech debt audit

Date: 2026-06-05

## Scope

This report is a source-level audit of visible tech debt markers in the repository. It uses code comments and suppressions as evidence, not runtime profiling or ownership interviews. Generated OpenAPI, lockfiles, build output, `node_modules`, vendor files, and locale catalogs were excluded from the counts.

Confluence and Jira updates were requested, but this environment does not expose Confluence, Jira, or Atlassian MCP tools. Publish this report to Confluence and apply the `Tech Debt` label to the Jira tickets listed below once those integrations are available.

## Summary metrics

| Signal | Count | Interpretation |
| --- | ---: | --- |
| `TODO`, `FIXME`, `HACK`, `XXX` markers | 1,739 | Directly recorded follow-up work and known compromises |
| Deprecation markers | 1,482 | Legacy APIs, compatibility paths, and scheduled removals |
| Lint/type suppressions | 2,725 | Places where static checks are bypassed or type contracts are incomplete |

Largest source-level clusters:

| Area | TODO/FIXME/HACK markers | Deprecation markers | Lint/type suppressions |
| --- | ---: | ---: | ---: |
| `public/app` | 500 | 332 | 1,090 |
| `pkg/services` | 260 | 209 | 584 |
| `pkg/registry` | 195 | 46 | 104 |
| `pkg/storage` | 118 | 79 | 103 |
| `packages/grafana-ui` | 54 | 126 | 152 |

## High-priority tech debt

| Priority | Area | Evidence | Risk | Recommended Jira ticket |
| --- | --- | --- | --- | --- |
| P0 | Secret storage validation | `pkg/storage/secret/encryption/query.go` has multiple `Validate()` methods returning `nil // TODO`. | Invalid encrypted value and data-key queries can reach shared storage code without invariant checks. | `TECHDEBT-SECRET-STORAGE-VALIDATION` |
| P0 | SSO settings reload | `pkg/services/ssosettings/ssosettingsimpl/service.go` still has `panic("not implemented") // TODO: Implement` in `Reload`. | Runtime panic if the public service method is called. | `TECHDEBT-SSO-RELOAD-IMPLEMENTATION` |
| P1 | Team service Kubernetes migration | `pkg/services/team/teamimpl/team.go` routes several methods to legacy service because Kubernetes implementations are incomplete. | Split behavior between legacy and Kubernetes-backed services keeps migration risk high. | `TECHDEBT-TEAM-K8S-PARITY` |
| P1 | Team member UID migration cleanup | `pkg/services/team/teamimpl/store.go` says to remove the compatibility migration around Q2 2026. | Upgrade/downgrade compatibility code can become stale and keep running after its intended window. | `TECHDEBT-TEAM-UID-MIGRATION-CLEANUP` |
| P1 | Alerting frontend backlog | `public/app/features/alerting/unified/TODO.md` tracks refactoring, skipped tests, and UI improvements. | Feature-local debt is already known but not promoted to durable issue tracking. | `TECHDEBT-ALERTING-FRONTEND-BACKLOG` |
| P1 | Explore trace-to-logs/metrics links | `public/app/features/explore/TraceView/createSpanLink.tsx` keeps data-source-specific link creation in Explore while relying on deprecated blob format. | Cross-data-source behavior stays centralized in Explore and remains coupled to deprecated trace metadata. | `TECHDEBT-EXPLORE-TRACE-LINKS-OWNERSHIP` |
| P1 | Provisioning export memory/version handling | `pkg/registry/apis/provisioning/jobs/export/*` includes FIXMEs for preserving original API versions and loading folder trees into memory. | Large provisioning exports can carry memory risk and version skew. | `TECHDEBT-PROVISIONING-EXPORT-SCALABILITY` |
| P2 | `@grafana/ui` deprecated components | `packages/grafana-ui/src/components` includes deprecated layout, form, info, dropdown, drawer, and list components. | Consumers keep depending on APIs intended for removal, increasing major-version migration cost. | `TECHDEBT-GRAFANA-UI-DEPRECATION-BURNDOWN` |
| P2 | Frontend type and lint suppressions | `public/app` has 1,090 lint/type suppressions in source files. | Type safety and accessibility checks are bypassed in high-traffic UI code. | `TECHDEBT-FRONTEND-SUPPRESSION-BURNDOWN` |
| P2 | Backend lint suppressions | `pkg/services` has 584 lint suppressions, with additional clusters in `pkg/tests`, `pkg/registry`, and `pkg/storage`. | Static analysis exceptions can mask regressions and make future refactors slower. | `TECHDEBT-BACKEND-SUPPRESSION-BURNDOWN` |

## Proposed Jira updates

Apply label: `Tech Debt`

| Jira ticket | Summary | Suggested owner area |
| --- | --- | --- |
| `TECHDEBT-SECRET-STORAGE-VALIDATION` | Add validation to secret storage SQL query structs and shared template helpers. | Backend storage |
| `TECHDEBT-SSO-RELOAD-IMPLEMENTATION` | Implement or remove the SSO settings reload method that currently panics. | Auth / SSO |
| `TECHDEBT-TEAM-K8S-PARITY` | Finish Kubernetes-backed team service parity and remove legacy fallbacks. | Identity / teams |
| `TECHDEBT-TEAM-UID-MIGRATION-CLEANUP` | Remove team member UID migration after its compatibility window. | Identity / teams |
| `TECHDEBT-ALERTING-FRONTEND-BACKLOG` | Promote alerting TODO items into tracked issues and burn down skipped/refactor items. | Alerting frontend |
| `TECHDEBT-EXPLORE-TRACE-LINKS-OWNERSHIP` | Move trace link generation into data sources and remove deprecated blob coupling. | Explore / data sources |
| `TECHDEBT-PROVISIONING-EXPORT-SCALABILITY` | Address provisioning export memory behavior and original API-version preservation. | Provisioning |
| `TECHDEBT-GRAFANA-UI-DEPRECATION-BURNDOWN` | Migrate consumers away from deprecated `@grafana/ui` components. | Design system |
| `TECHDEBT-FRONTEND-SUPPRESSION-BURNDOWN` | Reduce TypeScript, ESLint, and accessibility suppressions in `public/app`. | Frontend platform |
| `TECHDEBT-BACKEND-SUPPRESSION-BURNDOWN` | Review and reduce Go lint suppressions in backend service and storage packages. | Backend platform |

## Follow-up audit commands

Use these commands to refresh the report:

- `rg --count-matches '\b(TODO|FIXME|HACK|XXX)\b' pkg public/app packages apps scripts devenv --glob '*.{go,ts,tsx,js,jsx,scss,md,sh}'`
- `rg --count-matches '@deprecated|Deprecated:|\bdeprecated\b' pkg public/app packages apps scripts devenv --glob '*.{go,ts,tsx,js,jsx,scss,md}'`
- `rg --count-matches 'eslint-disable|ts-ignore|ts-expect-error|nolint' pkg public/app packages apps scripts devenv --glob '*.{go,ts,tsx,js,jsx}'`
