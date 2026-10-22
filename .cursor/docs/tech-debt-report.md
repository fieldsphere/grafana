# Grafana tech debt report

Generated: 2026-06-02

## Scope and method

This report is a signal-based inventory of technical debt in this repository. It combines a Code Explorer sub-agent review with repository searches for TODO, FIXME, HACK, XXX, deprecated APIs, skipped tests, flaky tests, compatibility layers, generated-code hotspots, and legacy directories.

This is not a literal proof that every debt item in the repository has been audited. The repository contains hundreds of debt markers, many generated files, and broad migration work that must be triaged by owning teams.

## External publishing status

Confluence and JIRA updates were requested, but no Confluence, JIRA, or Atlassian MCP tools are registered in this Cursor Cloud environment. Because no JIRA ticket identifiers or Atlassian API tools are available here, this report could not be posted to Confluence and tickets could not be updated with labels from this agent session.

Recommended label to apply to all related tickets:

- `tech-debt`

Recommended secondary labels are listed per theme below.

## Executive summary

The highest-risk debt is concentrated around ongoing platform migrations rather than isolated comments. The most important themes are:

1. Legacy API to Resource API and Unified Storage migration.
2. Dual-write and legacy SQL compatibility paths.
3. Secrets metadata validation stubs.
4. Provisioning and Git Sync validation/refactor gaps.
5. Dashboard schema version proliferation and conversion logic.
6. Alerting compatibility layers and skipped tests.
7. Deprecated frontend components and React Router compatibility shims.
8. Vendored or forked backend infrastructure such as XORM and Macaron.
9. Datasource plugin refactoring debt.
10. Test reliability and suppression debt.

## Prioritized debt inventory

### 1. Legacy API to Resource API and Unified Storage migration

Severity: Critical

The dominant architectural debt is the migration from legacy `/api/...` endpoints and SQL stores toward `/apis/...` Resource APIs and Unified Storage. The repository still carries dual-write code, legacy SQL fallbacks, and frontend clients that bridge both worlds.

Representative signals:

- `pkg/storage/legacysql/dualwrite/dualwriter.go` contains mode-driven dual-write routing.
- `pkg/registry/apis/iam/legacy/` contains legacy user, team, team binding, and service account stores.
- `pkg/registry/apis/dashboard/legacy/` contains legacy dashboard and snapshot storage.
- `pkg/services/team/teamimpl/team.go` includes multiple TODOs to enable the Kubernetes team service.
- `pkg/services/org/orgimpl/org.go` includes repeated TODOs to refactor service methods toward store CRUD methods.
- `public/app/api/clients/folder/v1beta1/hooks.ts` imports both legacy browse-dashboards APIs and app-platform clients.

Risks:

- Data divergence during dual-write operation.
- Inconsistent behavior between legacy and Resource API paths.
- Higher migration cost as new features continue to depend on legacy APIs.

Recommended JIRA labels:

- `tech-debt`
- `unified-storage`
- `resource-api`
- `dual-write`
- `legacy-api-removal`

Suggested ticket themes:

- Define and track exit criteria for dual-write per resource type.
- Retire legacy IAM and dashboard stores once Resource API coverage is complete.
- Remove frontend client shims after folder and dashboard flows move fully to Resource APIs.

### 2. Secrets metadata validation stubs

Severity: Critical

Several secrets storage query validation paths are currently stubbed with TODO returns.

Representative signals:

- `pkg/storage/secret/metadata/query.go` contains many `Validate()` methods returning nil with TODO comments.
- `pkg/storage/secret/encryption/query.go` includes additional encryption-query TODOs.
- `pkg/registry/apis/secret/service/secure_value.go` contains incomplete secret service TODOs.

Risks:

- Invalid query templates may pass validation.
- Future storage backends may rely on validators that do not enforce constraints.
- Security-sensitive code paths become harder to reason about.

Recommended JIRA labels:

- `tech-debt`
- `secrets`
- `validation`
- `security`

Suggested ticket themes:

- Implement all secret metadata query validators.
- Add table-driven tests for accepted and rejected secret metadata queries.
- Audit encryption query validators for the same class of gaps.

### 3. Provisioning and Git Sync debt

Severity: High

Provisioning and Git Sync code has dense FIXME and HACK clusters around validators, staged repositories, GitHub webhooks, and generated resource plumbing.

Representative signals:

- `apps/provisioning/pkg/repository/validator.go` has FIXME comments around validator and factory coupling.
- `apps/provisioning/pkg/repository/staged.go` has FIXME comments around error handling.
- `apps/provisioning/pkg/repository/github/webhook.go` has a HACK around GitHub secrets not being returned.
- `apps/provisioning/pkg/repository/github/impl.go` contains FIXME comments for messy code paths.
- `apps/provisioning/pkg/repository/git/staged.go` includes temporary hacks around go-git clone behavior.
- `pkg/registry/apis/provisioning/register.go` and related resource files contain migration TODOs.

Risks:

- Validation and admission behavior may differ between repository implementations.
- Error handling can obscure failed provisioning operations.
- GitHub-specific workarounds may become permanent coupling.

Recommended JIRA labels:

- `tech-debt`
- `git-sync`
- `provisioning`
- `validation`

Suggested ticket themes:

- Refactor repository validator and factory boundaries.
- Replace staged Git repository hacks with explicit lifecycle operations.
- Harden webhook secret handling and document provider-specific limitations.

### 4. Dashboard schema versions and conversion logic

Severity: High

Dashboard schema versions and generated types create a large compatibility surface across frontend, backend, and migration packages.

Representative signals:

- `packages/grafana-schema/src/schema/dashboard/` contains multiple schema versions such as `v0alpha1`, `v1beta1`, `v2`, `v2alpha0`, `v2alpha1`, and `v2beta1`.
- `packages/grafana-schema/src/schema/dashboard/v2/types.spec.gen.ts` contains a generated FIXME for `DashboardLinkType`.
- `packages/grafana-schema/src/common/common.gen.ts` contains many generated TODO markers.
- `apps/dashboard/pkg/migration/conversion/` contains conversion logic and tests for version migration behavior.
- `public/app/features/dashboard-scene/utils/dashboardSessionState.ts` references known scene serialization complexity.

Risks:

- Schema drift between generated TypeScript, Go, and CUE sources.
- Conversion bugs when downgrading or round-tripping dashboards.
- Duplicate migration logic across frontend and backend paths.

Recommended JIRA labels:

- `tech-debt`
- `dashboard-v2`
- `schema`
- `migration`

Suggested ticket themes:

- Consolidate dashboard schema version ownership and generation expectations.
- Fix generated dashboard link union output at the schema source.
- Add migration coverage for known lossy conversion paths.

### 5. Unified Alerting compatibility layers

Severity: High

Alerting carries compatibility code for legacy APIs, ruler and Cortex paths, temporary headers, and skipped tests.

Representative signals:

- `public/app/features/alerting/unified/` contains many TODOs and skipped tests.
- `public/app/features/alerting/unified/api/convertToGMAApi.ts` contains temporary API header TODOs.
- `public/app/features/alerting/unified/api/integrationSchemasApi.ts` contains Kubernetes versus legacy fallback logic.
- `public/app/features/alerting/unified/RuleList.test.tsx` contains skipped test blocks.
- `pkg/services/ngalert/api/compat/`, `pkg/services/ngalert/notifier/legacy_storage/`, and `pkg/services/ngalert/state/compat.go` preserve compatibility paths.

Risks:

- Divergent behavior between legacy and new alerting APIs.
- Skipped tests reduce confidence in migrations.
- Temporary headers and fallback behavior can harden into long-term API contracts.

Recommended JIRA labels:

- `tech-debt`
- `alerting`
- `ngalert`
- `legacy-removal`

Suggested ticket themes:

- Remove temporary alerting API headers after downstream migration.
- Unskip and stabilize RuleList and notification policy tests.
- Retire compatibility packages once supported migration windows close.

### 6. Deprecated frontend components and router compatibility

Severity: Medium

The frontend still exports deprecated components and compatibility layers that increase bundle surface and maintenance burden.

Representative signals:

- `packages/grafana-ui/src/graveyard/README.md` documents deprecated components intended for removal.
- `packages/grafana-ui/src/graveyard/GraphNG/` and `packages/grafana-ui/src/graveyard/TimeSeries/` still exist.
- `packages/grafana-ui/src/components/Forms/Legacy/` contains legacy form controls.
- `react-router-dom-v5-compat` appears in app routing code, including `public/app/AppWrapper.tsx` and route wrappers.
- Public packages contain many `@deprecated` exports in `@grafana/data` and `@grafana/ui`.

Risks:

- New code can accidentally depend on deprecated APIs.
- Compatibility shims block framework upgrades.
- Large public API surface increases support cost.

Recommended JIRA labels:

- `tech-debt`
- `frontend`
- `deprecation`
- `router-v6`

Suggested ticket themes:

- Remove or isolate graveyard component exports.
- Complete React Router compatibility migration.
- Add lint or documentation guardrails for new deprecated API usage.

### 7. Vendored or forked backend infrastructure

Severity: Medium

Several core backend paths rely on older or forked infrastructure.

Representative signals:

- `pkg/util/xorm/` contains multiple TODO and HACK markers.
- `pkg/web/macaron.go` and related files preserve the Macaron-style web framework abstraction.
- `pkg/web/web.go` keeps `Mux = Macaron` aliasing for compatibility.

Risks:

- Security and maintenance burden on forked dependencies.
- Framework behavior can differ from upstream expectations.
- Modernization work must account for broad internal coupling.

Recommended JIRA labels:

- `tech-debt`
- `backend`
- `xorm`
- `macaron`

Suggested ticket themes:

- Audit XORM fork divergence and decide whether to replace, reduce, or document ownership.
- Identify Macaron coupling boundaries and route modernization candidates.

### 8. Datasource plugin refactoring debt

Severity: Medium

Datasource plugins include half-finished refactors and duplicated client/server query paths.

Representative signals:

- `public/app/plugins/datasource/influxdb/queryUtils.ts` contains FIXME comments around query logic.
- `public/app/plugins/datasource/influxdb/influx_query_model.ts` contains legacy query model debt.
- `public/app/plugins/datasource/influxdb/components/FluxQueryEditor.tsx` contains Angular-related hacks.
- `public/app/plugins/datasource/loki/datasource.ts` contains TODOs for moving query behavior out of the frontend.
- CloudWatch log group selectors include legacy and newer UX paths.

Risks:

- Query behavior can diverge across editor modes.
- Legacy Angular or frontend-only paths delay plugin modernization.
- Duplicated logic raises maintenance cost across datasources.

Recommended JIRA labels:

- `tech-debt`
- `datasource`
- `influxdb`
- `loki`
- `cloudwatch`

Suggested ticket themes:

- Finish Influx query model refactor and remove Angular-era hacks.
- Move Loki query behavior to the intended backend path.
- Consolidate CloudWatch legacy and current log group selection flows.

### 9. Test reliability and suppression debt

Severity: Medium

Skipped tests, flaky markers, lint suppressions, and type suppressions reduce confidence in changes.

Representative signals:

- `pkg/services/store/service_test.go` skips a flaky test.
- `pkg/services/ngalert/notifier/redis_channel_test.go` skips a flaky Redis notifier test.
- `pkg/services/libraryelements/libraryelements_permissions_test.go` skips a permission test with a linked issue.
- `pkg/tests/apis/iam/team_binding_integration_test.go` skips a flaky team binding integration test.
- `pkg/tests/apis/folder/folders_test.go` skips a continue-token scenario.
- `pkg/tests/api/correlations/correlations_update_test.go` has flaky-test skips.
- `pkg/tsdb/loki/scopes_test.go` skips flaky Loki scope tests.
- `packages/grafana-ui/src/components/AutoSaveField/AutoSaveField.test.tsx` contains multiple skipped tests.
- Repository searches show broad use of `eslint-disable`, `@ts-ignore`, `nolint`, and `gosec` suppressions.

Risks:

- Regressions can hide in skipped paths.
- Suppressions normalize lower type and security signal.
- CI failure triage becomes less reliable.

Recommended JIRA labels:

- `tech-debt`
- `flaky-test`
- `test-debt`
- `ci`

Suggested ticket themes:

- Convert known flaky skips into tracked quarantine metadata with owners.
- Fix or delete stale skipped tests.
- Reduce suppressions in hot paths before broad refactors.

## Recommended JIRA update plan

Apply `tech-debt` to all tickets created from this report. Add secondary labels based on the affected area:

| Area | Secondary labels |
| --- | --- |
| Platform migration | `unified-storage`, `resource-api`, `dual-write`, `legacy-api-removal` |
| Secrets storage | `secrets`, `validation`, `security` |
| Provisioning and Git Sync | `git-sync`, `provisioning`, `validation` |
| Dashboards | `dashboard-v2`, `schema`, `migration` |
| Alerting | `alerting`, `ngalert`, `legacy-removal` |
| Frontend modernization | `frontend`, `deprecation`, `router-v6` |
| Backend infrastructure | `backend`, `xorm`, `macaron` |
| Datasources | `datasource`, `influxdb`, `loki`, `cloudwatch` |
| Test health | `flaky-test`, `test-debt`, `ci` |

Suggested ticket title format:

- `[Tech Debt][Area] Short action-oriented description`

Suggested acceptance criteria:

- The relevant compatibility shim, TODO, FIXME, skipped test, or deprecated export is removed.
- Tests prove the new behavior or migration path.
- Ownership and rollout notes are documented when the debt spans multiple teams.

## Suggested Confluence page outline

Use this report as the Confluence page body:

1. Executive summary.
2. Scope and method.
3. Prioritized debt inventory.
4. JIRA label taxonomy.
5. Recommended ticket themes.
6. Open questions and ownership.

## Open questions

- Which JIRA project and ticket set should receive the `tech-debt` label?
- Which Confluence space and parent page should host this report?
- Should generated-code TODOs be tracked separately from source TODOs?
- Which squads own the highest-risk migration exits for dual-write, secrets validation, and provisioning validation?
