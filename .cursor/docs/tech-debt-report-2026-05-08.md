# Tech debt report - 2026-05-08

## Scope

This report summarizes code-explorer reconnaissance across the Grafana repository, with emphasis on actionable debt that has explicit source evidence, disabled validation/tests, migration comments, or broad suppressions. It is formatted for Confluence publication and includes Jira-ready ticket summaries and labels.

## Atlassian publishing status

The Cursor Cloud environment did not expose a Confluence or Jira MCP resource, Atlassian CLI, or Jira/Confluence environment configuration. Because no Jira issue keys were provided, the ticket-label update could not be safely applied from this environment. Use the Jira update matrix below to create or update the relevant issues and apply the `tech-debt` label.

## Executive summary

The highest-priority debt clusters are:

1. Secret encryption SQL template validation is stubbed out in security-sensitive storage code.
2. Team service migration code has a dated removal marker and incomplete Kubernetes service parity.
3. Deprecated feature-toggle access remains wired after a two-year deprecation period.
4. Several tests are skipped with explicit blockers, reducing regression coverage in dashboard, alerting, store, and transformation workflows.
5. Frontend type/lint suppressions hide issues in shared packages and alerting forms.

## Findings

### 1. Secret encryption SQL template validation is stubbed

- Evidence:
  - `pkg/storage/secret/encryption/query.go:37`
  - `pkg/storage/secret/encryption/query.go:53`
  - `pkg/storage/secret/encryption/query.go:66`
  - `pkg/storage/secret/encryption/query.go:82`
  - `pkg/storage/secret/encryption/query.go:102`
  - `pkg/storage/secret/encryption/query.go:114`
  - `pkg/storage/secret/encryption/query.go:129`
- Risk: Every `Validate()` method in this query layer is a no-op. The file comments tie validation to future `dbutil` or unified storage usage, but invalid template state or unsafe query parameters would not be caught here today.
- Remediation: Implement validation for required fields and bounded list parameters, especially `OrderBy` and `OrderDirection`, or move validation into the shared `dbutil` path and ensure this store consistently uses it.
- Jira summary: `Implement encrypted-value SQL template validation`
- Suggested labels: `tech-debt`, `backend`, `security`, `secrets`

### 2. Team member UID migration has an explicit Q2 2026 removal marker

- Evidence:
  - `pkg/services/team/teamimpl/store.go:596`
  - `pkg/services/team/teamimpl/store.go:598`
- Risk: The backfill is intentionally temporary for upgrade/downgrade protection. Keeping it past the planned window creates recurring database work and makes future team-member lifecycle changes harder to reason about.
- Remediation: Confirm rollout and downgrade policy, then remove or gate the migration with version-aware checks.
- Jira summary: `Remove team_member UID backfill migration after Q2 2026`
- Suggested labels: `tech-debt`, `backend`, `database`, `teams`

### 3. Deprecated `Cfg.IsFeatureToggleEnabled` remains wired

- Evidence:
  - `pkg/setting/setting_feature_toggles.go:119`
  - `pkg/setting/setting_feature_toggles.go:137`
  - `pkg/setting/setting_feature_toggles.go:138`
- Risk: The deprecated configuration-level feature-toggle path remains active and requires a `staticcheck` suppression. This keeps two access patterns alive and can cause inconsistent feature flag behavior.
- Remediation: Audit remaining call sites, migrate them to `featuremgmt.FeatureToggles`, then remove the deprecated field assignment and suppression.
- Jira summary: `Remove deprecated Cfg.IsFeatureToggleEnabled after call-site migration`
- Suggested labels: `tech-debt`, `backend`, `feature-flags`

### 4. Team service Kubernetes path is incomplete

- Evidence:
  - `pkg/services/team/teamimpl/team.go:61`
  - `pkg/services/team/teamimpl/team.go:86`
  - `pkg/services/team/teamimpl/team.go:95`
  - `pkg/services/team/teamimpl/team.go:104`
  - `pkg/services/team/teamimpl/team.go:113`
  - `pkg/services/team/teamimpl/team.go:122`
  - `pkg/services/team/teamimpl/team.go:131`
  - `pkg/services/team/teamimpl/team.go:140`
- Risk: Some team operations route through the Kubernetes service while multiple delete and membership paths are explicitly held on the legacy service. This creates storage-mode drift and duplicated branching.
- Remediation: Implement the missing Kubernetes service methods or document unsupported operations behind a single routing strategy.
- Jira summary: `Finish Kubernetes team service parity for delete and membership paths`
- Suggested labels: `tech-debt`, `backend`, `teams`, `k8s`

### 5. Team API is coupled to legacy user service behavior

- Evidence:
  - `pkg/services/team/teamapi/api.go:22`
  - `pkg/services/team/teamapi/api.go:23`
  - `pkg/services/team/teamapi/api.go:24`
- Risk: `TeamAPI` still depends directly on `user.Service` for legacy functionality, with an explicit comment pointing to a future API-based replacement. This keeps the team API coupled to an older service boundary.
- Remediation: Follow the identity-access migration issue, replace direct `user.Service` usage with the intended API/client abstraction, and remove the dependency from `TeamAPI`.
- Jira summary: `Decouple Team API from direct user.Service dependency`
- Suggested labels: `tech-debt`, `backend`, `teams`, `identity`

### 6. `SignedInUser.IsNil()` remains as interface migration debt

- Evidence:
  - `pkg/services/user/identity.go:323`
  - `pkg/services/user/identity.go:324`
- Risk: A concrete nil-check helper exists only because not all services have converged on the identity interfaces. This works against idiomatic interface boundaries and keeps transitional API surface area alive.
- Remediation: Replace callers with interface-aware checks as services migrate, then remove `SignedInUser.IsNil()`.
- Jira summary: `Remove SignedInUser.IsNil after identity interface migration`
- Suggested labels: `tech-debt`, `backend`, `auth`, `identity`

### 7. Dashboard v2 API tests are skipped pending slug support

- Evidence:
  - `public/app/features/dashboard/api/v2.test.ts:183`
  - `public/app/features/dashboard/api/v2.test.ts:184`
  - `public/app/features/dashboard/api/v2.test.ts:204`
  - `public/app/features/dashboard/api/v2.test.ts:205`
- Risk: Create/update behavior in the Kubernetes dashboard v2 API has skipped coverage until slug is implemented in the response. Contract regressions can slip through while the tests remain disabled.
- Remediation: Implement slug population in the response, update expected values if needed, and unskip the tests.
- Jira summary: `Unskip dashboard v2 API create/update tests after slug response support`
- Suggested labels: `tech-debt`, `frontend`, `dashboard`, `tests`, `k8s`

### 8. Alerting unified frontend tests and MSW migration remain incomplete

- Evidence:
  - `public/app/features/alerting/unified/RuleList.test.tsx:550`
  - `public/app/features/alerting/unified/RuleList.test.tsx:632`
  - `public/app/features/alerting/unified/RuleList.test.tsx:645`
  - `public/app/features/alerting/unified/NotificationPoliciesPage.test.tsx:440`
  - `public/app/features/alerting/unified/NotificationPoliciesPage.test.tsx:616`
- Risk: Skipped alerting UI tests and pending Mock Service Worker migration reduce confidence in alerting refactors and can hide regressions in ordering or notification policy behavior.
- Remediation: Complete the MSW migration for the affected tests, address the rendering/order blockers, and re-enable skipped assertions.
- Jira summary: `Re-enable skipped alerting unified tests and complete MSW migration`
- Suggested labels: `tech-debt`, `frontend`, `alerting`, `tests`

### 9. Histogram transformer has a broad file-level lint suppression

- Evidence:
  - `packages/grafana-data/src/transformations/transformers/histogram.ts:19`
  - `packages/grafana-data/src/transformations/transformers/histogram.ts:20`
- Risk: The `/* eslint-disable */` before a large bucket table also suppresses linting for the rest of the module, masking unrelated issues in shared transformation code.
- Remediation: Scope the lint suppression to the generated/static table, or extract the table into data generated by a build step.
- Jira summary: `Narrow eslint-disable scope in histogram transformer`
- Suggested labels: `tech-debt`, `frontend`, `lint`, `grafana-data`

### 10. Alerting mute timing forms contain TypeScript ignore clusters

- Evidence:
  - `public/app/features/alerting/unified/components/mute-timings/MuteTimingTimeRange.tsx:54`
  - `public/app/features/alerting/unified/components/mute-timings/MuteTimingTimeRange.tsx:56`
  - `public/app/features/alerting/unified/components/mute-timings/MuteTimingTimeRange.tsx:71`
  - `public/app/features/alerting/unified/components/mute-timings/MuteTimingTimeRange.tsx:92`
  - `public/app/features/alerting/unified/components/mute-timings/MuteTimingTimeRange.tsx:124`
  - `public/app/features/alerting/unified/components/mute-timings/MuteTimingTimeInterval.tsx:62`
  - `public/app/features/alerting/unified/components/mute-timings/MuteTimingTimeInterval.tsx:72`
  - `public/app/features/alerting/unified/components/mute-timings/MuteTimingTimeInterval.tsx:90`
  - `public/app/features/alerting/unified/components/mute-timings/MuteTimingTimeInterval.tsx:122`
  - `public/app/features/alerting/unified/components/mute-timings/MuteTimingTimeInterval.tsx:141`
- Risk: Multiple `@ts-ignore` suppressions around nested `react-hook-form` field arrays bypass type checking in user-facing alerting forms.
- Remediation: Introduce typed field-array helpers or narrow controller wrappers so the form can be checked without `@ts-ignore`.
- Jira summary: `Replace alerting mute timing @ts-ignore usage with typed form patterns`
- Suggested labels: `tech-debt`, `frontend`, `alerting`, `typescript`

## Jira update matrix

| Ticket summary | Labels to apply |
| --- | --- |
| Implement encrypted-value SQL template validation | `tech-debt`, `backend`, `security`, `secrets` |
| Remove team_member UID backfill migration after Q2 2026 | `tech-debt`, `backend`, `database`, `teams` |
| Remove deprecated Cfg.IsFeatureToggleEnabled after call-site migration | `tech-debt`, `backend`, `feature-flags` |
| Finish Kubernetes team service parity for delete and membership paths | `tech-debt`, `backend`, `teams`, `k8s` |
| Decouple Team API from direct user.Service dependency | `tech-debt`, `backend`, `teams`, `identity` |
| Remove SignedInUser.IsNil after identity interface migration | `tech-debt`, `backend`, `auth`, `identity` |
| Unskip dashboard v2 API create/update tests after slug response support | `tech-debt`, `frontend`, `dashboard`, `tests`, `k8s` |
| Re-enable skipped alerting unified tests and complete MSW migration | `tech-debt`, `frontend`, `alerting`, `tests` |
| Narrow eslint-disable scope in histogram transformer | `tech-debt`, `frontend`, `lint`, `grafana-data` |
| Replace alerting mute timing @ts-ignore usage with typed form patterns | `tech-debt`, `frontend`, `alerting`, `typescript` |

## Suggested Confluence page metadata

- Page title: `Grafana tech debt reconnaissance - 2026-05-08`
- Parent page: engineering or platform technical debt register
- Owner: repository maintainers for the affected areas
- Review cadence: revisit after ticket triage and after Q2 2026 migration cleanup
