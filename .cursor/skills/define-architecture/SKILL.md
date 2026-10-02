---
name: define-architecture
description: Defines remaining Grafana /api → /apis architecture and fans out leftover slices. Use when planning or implementing the /api to /apis migration, resource API architecture, unified storage rollout, kubernetes* feature flags, leftover migration slices, or App SDK / ProvideAppInstallers work.
---

# Define remaining /api → /apis architecture

## First read

Read `/cursor/stores/self/docs/api-to-apis-migration.md` before proposing or implementing anything. That Project map is the inventory. Re-check cited paths in the working tree; do not treat store `internal/` reports as current unless re-verified.

Then skim only the in-repo files that apply to the slice:

- `contribute/architecture/k8s-inspired-backend-arch.md` — 9-step per-resource path
- `pkg/registry/apps/apps.go` — `ProvideAppInstallers` (rollout snapshot). `ProvideBuilderRunners` is deprecated.
- `pkg/storage/unified/migrations/contract/migrations.go` — collapsed storage modes
- `pkg/storage/unified/AGENTS.md` — client/server split and compatibility
- `pkg/storage/unified/migrations/README.md` — storage migrator runbook (ignore its default-enablement table; use `MigratedUnifiedResources`)
- `pkg/registry/apis/search/README.md` — when `/search` is safe
- `pkg/router/AGENTS.md` — topology limits
- `pkg/setting/setting_unified_storage.go` — `MigratedUnifiedResources`
- Directory `AGENTS.md` files under `pkg/storage/unified/`, `public/app/features/alerting/unified/`, and `docs/`

Also load `github-fieldsphere-fork` for any GitHub write.

## Three layers (never conflate)

A resource can be done on one layer and not the others. Plan and ship them separately.

| Layer | From | To | Trees |
|---|---|---|---|
| API surface | `/api/...` in `pkg/api/` | `/apis/<group>/<version>/namespaces/<ns>/<resource>` | `apps/`, `pkg/registry/apps/`, `pkg/registry/apis/` |
| Storage | domain SQL in `pkg/services/<domain>/` | unified store | `pkg/storage/unified/`, `pkg/storage/legacysql/dualwrite/` |
| Topology | one monolith process | aggregated apiserver / `pkg/router` split-out | `pkg/services/apiserver/`, `pkg/router/` |

Dashboards have a group *and* unified storage. Datasources have a group but default `legacy` storage. Annotations have a group, a frontend client, and an unregistered migrator — three unfinished layers.

## Pick one coexistence pattern per resource

There is **no** global `/api` → `/apis` redirect. Do not add one. Choose exactly one pattern for the resource and name it in the plan:

1. **Kubernetes client facade** — legacy route stays; handler uses a k8s client (`newPlaylistK8sHandler`, `preferenceK8sHandler`, `shortURLK8sHandler`).
2. **Path rewrite** — rewrite `c.Req.URL.Path` and `DirectlyServeHTTP` (snapshots; query path rewrite in `pkg/services/apiserver/builder/helper.go`).
3. **Service-layer redirect** — routes untouched; domain service delegates behind a toggle (teams, users).
4. **Wire-time service swap** — k8s or SQL chosen at DI time (correlations).
5. **Parallel, no redirect** — legacy handler still calls the domain service; only storage moved (dashboards, folders). Swagger `Deprecated: true` is not a deletion.
6. **Feature-gated CRUD rewrite** — `datasourcesRerouteLegacyCRUDAPIs` in `pkg/api/datasources_k8s.go`. 500s if sibling query/CRUD flags are off. Treat as its own pattern.

Frontend discovery (`grafana.kubernetesAnnotationsClient`) is not a server redirect. `/api/annotations` stays the guaranteed server path until a server pattern exists.

## Implementation preference

Prefer the **Apps Approach**: CUE kinds in `apps/<app>/` + installer in `pkg/registry/apps/<app>/` wired through `ProvideAppInstallers`.

- Do not add new `APIGroupBuilder`s in `pkg/registry/apis/` unless the resource needs a legacy-storage fallback that the App SDK path cannot host yet.
- Dashboard, folder, iam, preferences, collections, and provisioning still split kinds (`apps/`) from builders (`pkg/registry/apis/`). Expect to touch both trees; do not "finish" the split in the same PR as behavior.
- New apps under active development: off by default, enable via a dedicated `config.ini` section. Do not gate registration on `features.IsEnabledGlobally` (deprecated). IAM `[iam] api = …` is the production example — when set, it wins over `kubernetes*` flags.

## Storage: collapsed three-mode model only

Runtime truth is `StorageModeLegacy` | `StorageModeDualWrite` | `StorageModeUnified` in `pkg/storage/unified/migrations/contract/migrations.go`. Mode0–Mode5 are config input and metric labels, not runtime behavior. Mode3 does **not** read unified.

Resolution (`migrationStatusReader.resolveStorageMode`):

1. Successful `unifiedstorage_migration_log` row → Unified (wins; cached forever in-process)
2. Config `dualWriterMode` 1–3 → DualWrite
3. Config 4–5 → Unified (temporary cloud backfill fallback)
4. Else → Legacy

`applyMigrationEnforcements` force-sets migration-enabled resources to `DualWriterMode: 5`. Per-resource config is ignored for those. Advancement is the log row, not a human bumping config.

Select backends with `dualwrite.NewSelector[T]` and `Resolve(ctx)` per operation. A mode lookup error returns the zero value — never a silent fallback.

Follow `pkg/storage/unified/AGENTS.md`: do not move client and server responsibility in one PR; proto/`resourcepb` changes must be additive; new client expectations need a fallback. Unified storage can deploy on a different cadence than the API layer.

Do not plan annotation storage as migrated: `pkg/registry/apps/annotation/migrator/` is not in `ProvideMigrationRegistry` and annotations are not in `MigratedUnifiedResources`.

`/search` is mounted by default and lies in Legacy (empty) and DualWrite (partial/wrong, 200). Only Unified is safe. Confirm the kind is `StorageModeUnified` before relying on search.

## Feature-flag ladder

Copy IAM: `kubernetesXxxApi` → `kubernetesXxxRedirect` → `kubernetesXxxRedirectNoFallback`.

- **Api** — serve the `/apis` group/resource.
- **Redirect** — legacy service/handler delegates to `/apis`, with legacy fallback.
- **NoFallback** — delegation failures surface; no silent SQL fallback.

Do not jump to NoFallback. Do not invent a single catch-all `kubernetesDashboards` (dashboards use discovery). Grepping `kubernetes*` misses `grafana.kubernetesAnnotationsClient`, namespaced snapshot/library-panel keys, `useKubernetesShortURLsAPI`, and `[iam] api`.

After `make gen-feature-toggles` when adding flags.

## Topology

`pkg/router` is CRUD + List, HTTP/1.1 only. **No Watch, upgrades, or streaming.** One backend owns every version of a group. Do not split a watch-heavy group. `[cloud_router].apiserver_url` is a hard error; use `appmanifest_apiserver_url`. Core groups (folder, dashboard, secret) have no AppManifest CR and fall back to embedded manifests.

## PR and deletion policy

- Frontend and backend are **separate PRs** (different deploy cadences). A backend group can be complete while the UI still calls `/api`.
- Do **not** delete a legacy route because `/apis` exists. Legacy stays until a dated deprecation and a follow-up deletion PR. `/api` is additive; `pkg/api/api.go` has not shrunk.
- Official text: legacy remains fully accessible; removal is "a future major release" (`docs/sources/shared/developers/deprecated-apis.md`). Query history is not migrating.
- Safe deletion is its own slice: no remaining in-repo callers, documented successor, and a coexistence pattern that already carries production traffic. Precedent: numeric datasource-id APIs, v13 Alertmanager removals, test-receivers 410.

Frontend clients: prefer generated `@grafana/api-clients/rtkq/<group>/<version>`. Codegen: OpenAPI snapshot test → `yarn workspace @grafana/openapi process-specs` → `yarn generate-apis`. Do not invent new RTKQ endpoints next to generated ones.

## GitHub writes

Target **fieldsphere/grafana** only. Follow `github-fieldsphere-fork`. Never open, edit, or merge PRs/issues against `grafana/grafana` unless the user explicitly asks for upstream.

## After mapping: fan out leftover slices

Do not implement a mega-PR. After the map (or a scoped refresh), list leftover slices and start **one worker per slice**.

A slice is one resource × one layer × one side (backend **or** frontend), for example:

- annotations: register the existing migrator (storage only)
- annotations: server coexistence pattern (API surface; pick one from the list)
- annotations: generated `/apis` client (frontend PR)
- IAM users: Redirect → NoFallback (backend)
- datasources: storage DualWrite, separate from the CRUD rewrite flags
- router split-out: only if the group is CRUD+List

Reject slices that mix FE+BE, add `/apis` + delete `/api`, or move unified client and server in one change.

Each worker gets: resource, layer, chosen coexistence pattern (if API), storage mode in/out, flag ladder step, files to touch, out-of-scope list, and `Target repo: fieldsphere/grafana`.

## Hard constraints

- No global `/api` → `/apis` redirect.
- Do not treat Mode0–Mode5 or `enable_data_sync` as runtime truth.
- Do not rename leftover SQL tables (`_legacy`) while any path still reads them.
- `BulkProcess` deletes the collection before write; namespace comes from `opts.Namespace`.
- `ValidateServedVersions`: migrated data with an unregistered `apiVersion` is unservable.
- Unified `search_backed_list_resources` / generic `/search` is wrong for kinds that are not Unified-indexed (preferences, stars already disabled).
