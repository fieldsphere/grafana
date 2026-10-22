# Grafana tech debt report

Date: 2026-05-20

## Executive summary

This report documents code-based technical debt found during repository reconnaissance. The highest-risk themes are platform migrations that keep two implementations live, frontend compatibility layers that affect core navigation and dashboards, and skipped tests around alerting behavior where regressions could delete or mutate user rules.

Recommended JIRA label for all items: `tech-debt`.

## Reconnaissance method

- Launched a code explorer sub-agent to scan the repository for TODO, FIXME, deprecated APIs, compatibility shims, skipped tests, and migration layers.
- Verified representative high-impact findings directly in source files before writing this report.
- Checked the local environment for Confluence and JIRA integration. No MCP resources or Atlassian command-line tools were configured, so external posting and ticket updates are blocked until credentials/tooling are available.

## Priority findings

| Priority | Area | Evidence | Why it matters | Recommended action |
| --- | --- | --- | --- | --- |
| High | Legacy SQL to unified storage dual-write layer | `pkg/storage/legacysql/dualwrite/dualwriter.go:40-88` | Reads and writes are routed through legacy and unified storage, including background reconciliation paths. Two storage implementations must stay consistent. | Finish migration per resource type, retire dual-write modes, and unskip coverage for non-dashboard/folder resources. |
| High | React Router v5 to v6 compatibility | `public/app/AppWrapper.tsx:7`, `public/app/routes/RoutesWrapper.tsx`, `public/test/test-utils.tsx:77-97` | The app still depends on `react-router-dom-v5-compat`, keeping mixed routing semantics in production and tests. | Complete v6 migration, remove `CompatRouter`, and simplify route test helpers. |
| High | Angular dashboard and navigation remnants | `public/app/features/dashboard/state/PanelModel.ts:76-145`, `public/app/features/dashboard/state/initDashboard.ts:174-175`, `public/app/core/navigation/patch/RouteProvider.ts:1-13` | Dashboard code still carries Angular panel migration maps, property cleanup, and navigation patches for pre-React behavior. | Finish panel migration cleanup and remove Angular-specific bootstrap and navigation patches. |
| High | Kubernetes team service fallback | `pkg/services/team/teamimpl/team.go:61-147` | Several team methods have disabled Kubernetes routing with TODO comments and still fall through to the legacy service. | Complete missing Kubernetes implementations and enable feature-gated routing consistently. |
| High | Alerting dual rule-list UI and legacy Redux state | `public/app/features/alerting/unified/RuleList.tsx:5-21`, `public/app/features/alerting/unified/AGENTS.md:101-184` | v1 and v2 rule lists coexist, while alerting guidelines state RTK Query is preferred and Redux is legacy. | Make v2 the default, delete v1, and migrate remaining Redux selectors to RTK Query or generated API clients. |
| High | Alerting skipped tests with safety impact | `public/app/features/alerting/unified/RuleList.test.tsx:550-650` | A skipped reorder-after-filter test notes that rules could be deleted if behavior regresses. Other skipped suites depend on legacy mocks. | Port tests to MSW and re-enable skipped rule-list behavior coverage before removing v1. |
| Medium | InfluxDB query-model partial refactor | `public/app/plugins/datasource/influxdb/queryUtils.ts:4-33` | FIXME comments show query logic is split between a mutable model and a partially typed utility layer. | Move normalization/rendering into typed utilities and reduce mutation in `InfluxQueryModel`. |
| Medium | Global setting configuration access | `pkg/setting/setting.go:90-92` | `Cfg` direct access is deprecated and global variables remain outside the provider abstraction. | Migrate callers to `ConfigProvider` and retire deprecated direct access on a versioned schedule. |
| Medium | Secret encryption SQL validation stubs | `pkg/storage/secret/encryption/query.go:37-116` | Multiple `Validate()` methods return `nil // TODO`, leaving SQL template validation incomplete at a sensitive storage boundary. | Implement validation or reuse unified-storage validators, then extract the template helper. |
| Medium | Datasource plugin debt in Loki and InfluxDB | `public/app/plugins/datasource/loki/datasource.ts`, `public/app/plugins/datasource/influxdb/queryUtils.ts:4-33` | Deprecated APIs, FIXME comments, and legacy editor paths increase plugin maintenance cost. | Split remediation by plugin and remove deprecated code after migration windows. |
| Medium | Large monolithic files | `pkg/setting/setting.go`, `public/app/features/dashboard/state/DashboardMigrator.ts`, `public/app/plugins/datasource/loki/datasource.ts` | Large files mix concerns and make tests/reviews harder. | Extract submodules by configuration section, migration step, or query behavior when related work touches these areas. |
| Low-Medium | Test infrastructure shims | `public/test/global-jquery-shim.ts`, `public/test/helpers/TestProvider.tsx`, `public/test/jest-setup.ts` | Global jQuery and deprecated wrappers remain for older tests. | Migrate remaining tests to `public/test/test-utils` and remove the shim when unused. |

## Proposed JIRA ticket updates

Use these as the first ticket set to label with `tech-debt`. If existing JIRA tickets already cover any item, update those tickets instead of creating duplicates.

| Suggested ticket title | Labels | Component | Acceptance criteria |
| --- | --- | --- | --- |
| Retire legacy SQL dual-write storage modes | `tech-debt`, `storage`, `migration` | Platform storage | Resource migration status is documented, dual-write modes are removed for completed resources, and skipped runtime coverage is restored. |
| Complete React Router v6 migration | `tech-debt`, `frontend`, `routing` | Frontend platform | `react-router-dom-v5-compat` imports are removed and route test helpers use the v6 router directly. |
| Remove Angular dashboard compatibility remnants | `tech-debt`, `dashboard`, `angular-removal` | Dashboards | Angular auto-migration maps, old service bootstrap, and navigation patches are deleted or replaced by React-only paths. |
| Finish Kubernetes team service redirect coverage | `tech-debt`, `iam`, `kubernetes` | Identity and access | All team service methods either route through Kubernetes under the feature flag or have documented blockers. |
| Consolidate alerting rule-list v2 and re-enable skipped safety tests | `tech-debt`, `alerting`, `tests` | Alerting | v2 rule list is default, v1 is removed, skipped reorder and pause/edit tests are ported to MSW and enabled. |
| Complete InfluxDB query utility refactor | `tech-debt`, `datasource`, `influxdb` | Datasources | Query normalization and rendering are typed, centralized, and covered by migrated unit tests. |
| Implement secret SQL template validation | `tech-debt`, `security`, `storage` | Secrets storage | SQL query structs validate required fields and share a common template helper. |

## Confluence-ready summary

The repository has several intentional migration layers that now represent meaningful tech debt. The most urgent work is to close high-blast-radius compatibility windows: storage dual-write, React Router compatibility, Angular dashboard remnants, Kubernetes team service fallback, and alerting rule-list/test debt. These areas carry correctness risk because they keep duplicate behavior live or reduce regression coverage around user-facing workflows.

The recommended first milestone is to create a labeled `tech-debt` JIRA epic with the ticket set above, then assign owners by subsystem. Each ticket has a concrete deletion or re-enable outcome so the work does not become open-ended cleanup.

## External publishing status

- Confluence: blocked. No Confluence MCP resource or command-line client is configured in this environment.
- JIRA: blocked. No JIRA MCP resource or command-line client is configured, and no ticket IDs were supplied.
- Local artifact: this report is available at `.cursor/docs/tech-debt-report.md` for posting once Atlassian access is configured.
