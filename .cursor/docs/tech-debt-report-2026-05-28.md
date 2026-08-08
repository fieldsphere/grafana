# Tech debt report - 2026-05-28

## Scope and method

This report identifies high-signal technical debt in the Grafana repository. It is based on local code review, marker searches for `TODO`, `FIXME`, `HACK`, skipped and flaky tests, local ownership guidance, and a read-only Code Explorer sub-agent investigation.

Confluence and JIRA status: this environment has no exposed Atlassian MCP resources, no `jira`, `confluence`, `atlas`, or `acli` command, and no Atlassian-related environment variables. The report below is ready to post to Confluence, and the JIRA table lists the ticket updates that should receive the `tech-debt` label once JIRA access and ticket identifiers are available.

## Executive summary

The strongest debt clusters are:

1. Unified storage and legacy dual-write migration.
2. Dashboard dual-stack architecture and multi-version schema conversion.
3. Provisioning API workarounds and oversized registration/controller surfaces.
4. Alerting frontend migration debt that is already partially governed by local squad guidance.
5. Skipped and flaky tests around Kubernetes API integration and alerting UI behavior.
6. Broad frontend compatibility shims, especially React Router v5 compatibility imports.
7. Generated-code override patterns where hand-written patches compensate for incomplete OpenAPI or CUE output.

## Findings

### 1. Unified storage and legacy dual-write migration

Risk: high backend risk. The codebase carries parallel legacy and unified storage paths, including runtime dual-write behavior and tests that are skipped until non-dashboard/folder resources use the mechanism.

Evidence:

- `pkg/storage/legacysql/dualwrite/runtime_test.go:162` and `pkg/storage/legacysql/dualwrite/runtime_test.go:241` skip tests until broader resource coverage exists.
- `pkg/registry/apis/provisioning/resources/dualwriter.go:26-34` says the provisioning dual reader/writer writes both Git and Grafana resources and does not yet support folders.
- `pkg/registry/apis/provisioning/resources/dualwriter.go:60-63` leaves directory reads unimplemented.

Recommended action: finish resource coverage, retire legacy adapters where possible, and add integration coverage for resource types that still depend on dual-write mode switches.

### 2. Dashboard dual-stack and schema conversion complexity

Risk: high product and migration risk. Dashboard code supports legacy JSON, structured v2 schemas, Scenes, and Angular panel migration compatibility.

Evidence:

- `apps/dashboard/pkg/migration/README.md:36-63` documents chained conversions across v0alpha1, v1beta1, and v2 schemas.
- `apps/dashboard/pkg/migration/README.md:65-117` documents `__angularMigration` temporary data that preserves Angular panel migration data for frontend processing.

Recommended action: track the remaining DashboardModel-to-Scenes retirement work, constrain new functionality to the target architecture, and define exit criteria for removing `__angularMigration`.

### 3. Provisioning API workaround density

Risk: high maintainability risk. Provisioning has multiple explicit workarounds across controller, export, webhook, usage, and test paths.

Evidence:

- `pkg/registry/apis/provisioning/controller/repository.go:365-370` calls out unknown multi-tenant and heavy-load behavior for sync job queueing.
- `pkg/registry/apis/provisioning/jobs/export/folders.go:21` notes that export loads the entire folder tree in memory.
- `pkg/registry/apis/provisioning/jobs/export/resources.go:22` and `pkg/registry/apis/provisioning/jobs/export/resources.go:105` call out version-preservation gaps.
- `pkg/registry/apis/provisioning/usage/usage.go:34` and `pkg/registry/apis/provisioning/usage/usage.go:44` hard-code the `default` namespace for single-tenant behavior.

Recommended action: split provisioning debt into controller scalability, export version fidelity, namespace handling, and webhook abstraction tickets.

### 4. Alerting frontend migration debt

Risk: medium to high frontend risk, but governed. Local guidance explicitly says RTK Query and generated API clients are the preferred direction, while legacy Redux and endpoint overrides remain.

Evidence:

- `public/app/features/alerting/unified/AGENTS.md:103-122` says RTK Query and generated API clients are preferred.
- `public/app/features/alerting/unified/AGENTS.md:134-176` permits `enhanceEndpoints` only as a generated-client gap workaround and requires a TODO for removal.
- `public/app/features/alerting/unified/AGENTS.md:178-184` marks Redux Toolkit usage as legacy.
- `public/app/features/alerting/unified/api/testReceiversApi.ts:24-35` uses `enhanceEndpoints` to patch request-body typing.
- `public/app/features/alerting/unified/RuleList.test.tsx:550`, `:603`, and `:650` skip rule-list test suites.

Recommended action: create a squad-owned backlog to remove remaining manual RTK Query wrappers, retire legacy Redux paths as features move, and re-enable skipped RuleList and NotificationPolicies tests.

### 5. Skipped and flaky test coverage holes

Risk: medium to high release confidence risk. Kubernetes API integration tests include many environment-gated skips plus explicit flaky skips.

Evidence:

- `pkg/tests/apis/folder/folders_test.go:184` skips a flaky continue-token test.
- `pkg/tests/apis/iam/team_binding_integration_test.go:24` skips a flaky context-cancelled failure.
- `pkg/tests/apis/shorturl/shorturl_test.go:258` skips flaky redirect tests.
- `pkg/tests/apis/dashboard/integration/api_validation_test.go:604`, `:747`, and `:805` skip provisioning, size limit, and quota coverage.

Recommended action: separate environment-gated skips from known flaky tests, then prioritize flakes that hide authorization, pagination, quota, or redirect behavior.

### 6. Frontend compatibility shims and deprecated UI

Risk: medium migration risk. React Router v5 compatibility imports are widespread, and deprecated UI components still exist.

Evidence:

- `react-router-dom-v5-compat` imports appear in core navigation, dashboard, datasources, alerting, admin, and `@grafana/ui` files.
- `packages/grafana-ui/src/graveyard/README.md:1` says the folder contains deprecated items to be removed.

Recommended action: track React Router v6 completion by feature area and delete graveyard components once no supported consumers remain.

### 7. Generated-code overrides and datasource refactor leftovers

Risk: medium maintainability risk. Generated clients are preferred, but hand-written endpoint patches remain. InfluxDB query code also has unfinished refactor markers.

Evidence:

- `public/app/features/alerting/unified/api/testReceiversApi.ts:24-35` patches a generated endpoint.
- `public/app/plugins/datasource/influxdb/queryUtils.ts:4-31` says the functions are only the beginning of a refactor from `influx_query_model.ts`.
- `public/app/plugins/datasource/influxdb/influx_query_model.ts:182` calls for merging duplicated query-builder logic.
- `public/app/plugins/datasource/influxdb/components/editor/query/influxql/utils/tagUtils.ts:7-13` says tag quoting logic must be synced with query-string generation code.

Recommended action: fix OpenAPI or CUE sources before deleting local endpoint overrides, and finish the InfluxDB query-model consolidation.

## Recommended JIRA updates

Apply the `tech-debt` label to the following tickets. If these tickets do not already exist, create them with the listed title and labels.

| Ticket title | Labels |
| --- | --- |
| Complete unified-storage dual-write migration and remove legacy adapters | `tech-debt`, `backend`, `unified-storage` |
| Stabilize and unskip Kubernetes API integration tests for folders, IAM, dashboard, and alerting | `tech-debt`, `testing`, `flaky-tests`, `backend` |
| Reduce provisioning API workaround surface in sync, export, webhook, and namespace handling | `tech-debt`, `provisioning`, `backend` |
| Consolidate dashboard architecture and retire legacy DashboardModel paths as Scenes coverage matures | `tech-debt`, `dashboard`, `frontend` |
| Remove Angular panel migration shim after plugin migration completion | `tech-debt`, `dashboard`, `migration` |
| Remove alerting generated-client endpoint overrides after OpenAPI request-body types are fixed | `tech-debt`, `alerting`, `frontend`, `codegen` |
| Retire legacy Redux state in alerting unified frontend | `tech-debt`, `alerting`, `frontend` |
| Complete React Router v6 migration and remove v5 compatibility imports | `tech-debt`, `frontend`, `routing` |
| Delete deprecated grafana-ui graveyard components after consumer migration | `tech-debt`, `frontend`, `grafana-ui` |
| Finish InfluxDB query model consolidation | `tech-debt`, `datasource`, `influxdb` |
| Fix explicitly flaky backend tests in folder, IAM, and short URL API suites | `tech-debt`, `testing`, `flaky-tests`, `backend` |
| Re-enable skipped alerting RuleList and NotificationPolicies frontend tests | `tech-debt`, `alerting`, `testing` |

## Confluence posting content

Use this document as the Confluence page body. Suggested page title:

`Grafana tech debt report - 2026-05-28`

Suggested labels:

`tech-debt`, `grafana`, `engineering`, `repository-review`

## Follow-up needed outside this environment

1. Post this report to Confluence using the suggested page title and labels.
2. Resolve the actual JIRA issue keys for the ticket table.
3. Add `tech-debt` to those JIRA issues, along with the secondary labels listed in the table.
4. Link the Confluence page from each JIRA issue for traceability.
