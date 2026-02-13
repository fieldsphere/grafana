# API to APIs migration status

This document tracks the status of Grafana's migration from legacy `/api/` endpoints to Kubernetes-style Resource APIs (`/apis/`).

## Overview

Grafana is adopting a Kubernetes-inspired, resource-oriented model for all core resources (dashboards, folders, datasources, alert rules, etc.). This migration addresses limitations of the traditional Legacy APIs:

- **Inconsistent designs:** Variations in structure, parameters, and response formats across different endpoints.
- **No versioning:** Difficulty managing breaking changes and API evolution without clear versioning.
- **Absence of schemas:** Lack of machine-readable schemas hindered programmatic interaction, validation, and tooling.
- **Limited extensibility model:** No standardized way for Grafana plugins to extend core APIs.

For detailed architecture information, refer to [the Kubernetes-inspired backend architecture documentation](./k8s-inspired-backend-arch.md).

## Key differences

| Aspect | Legacy API (`/api/...`) | Resource API (`/apis/...`) |
|--------|------------------------|---------------------------|
| **URL structure** | Variable paths (e.g., `/api/dashboards/uid/:uid`) | Kubernetes conventions (e.g., `/apis/<group>/<version>/namespaces/<namespace>/<resource>/<name>`) |
| **Versioning** | Less explicit | Explicit API versions (`v0alpha1`, `v1beta1`, `v1`) |
| **Schemas** | Structures vary | Well-defined schemas with always-in-sync OpenAPI spec |
| **Namespacing** | Implicit org context | Explicit namespaces in path |
| **Error handling** | Variable formats | Kubernetes error response conventions |

## Implementation approaches

### Registry approach

Located in `pkg/registry/apis/`, this is the original method using Go code in `register.go` files. Still used for legacy fallbacks when data exists outside of unified storage.

**Current registry APIs:**

| API | Path | Description |
|-----|------|-------------|
| collections | `pkg/registry/apis/collections` | User collections (stars) |
| dashboard | `pkg/registry/apis/dashboard` | Dashboard management |
| datasource | `pkg/registry/apis/datasource` | Data source management |
| folders | `pkg/registry/apis/folders` | Folder management |
| iam | `pkg/registry/apis/iam` | Identity and access management |
| ofrep | `pkg/registry/apis/ofrep` | Open Feature Remote Evaluation Protocol |
| preferences | `pkg/registry/apis/preferences` | User preferences |
| provisioning | `pkg/registry/apis/provisioning` | Provisioning and GitOps |
| query | `pkg/registry/apis/query` | Query service |
| secret | `pkg/registry/apis/secret` | Secrets management |
| service | `pkg/registry/apis/service` | Service discovery |
| userstorage | `pkg/registry/apis/userstorage` | User storage |

### Apps approach

Located in `apps/`, this is the newer, more modular implementation using CUE schemas. Each app defines resources in `kinds/*.cue` files and are registered via the App SDK. This is the direction Grafana is moving towards for all resources.

**Benefits:**

- Schema-first with CUE definitions providing strong typing, validation, and code generation
- Modularity with each app self-contained with its own versioning
- Support for controllers/reconcilers that watch resources and align system state
- Admission webhooks for validation or mutation logic

## Migration status by resource

### Generally available (GA)

These resources have completed migration and are enabled by default:

| Resource | Feature flag | API group | Version | Notes |
|----------|--------------|-----------|---------|-------|
| **Dashboards** | `kubernetesDashboards` | `dashboard.grafana.app` | `v0alpha1`, `v1beta1`, `v2beta1` | Enabled by default. Frontend uses Kubernetes API. |

### In development (experimental)

These resources are behind feature flags and not enabled by default:

| Resource | Feature flag | API group | Version | Owner |
|----------|--------------|-----------|---------|-------|
| **Alerting rules** | `kubernetesAlertingRules` | `rules.alerting.grafana.app` | `v0alpha1` | @grafana/alerting-squad |
| **Alerting notifications** | (always enabled when rules enabled) | `notifications.alerting.grafana.app` | `v0alpha1` | @grafana/alerting-squad |
| **Alerting historian** | `kubernetesAlertingHistorian` | `historian.alerting.grafana.app` | `v0alpha1` | @grafana/alerting-squad |
| **Annotations** | `kubernetesAnnotations` | `annotation.grafana.app` | `v0alpha1` | @grafana/backend-services-squad |
| **Correlations** | `kubernetesCorrelations` | `correlations.grafana.app` | `v0alpha1` | @grafana/data-pro-squad |
| **Library panels** | `kubernetesLibraryPanels` | - | - | @grafana/grafana-app-platform-squad |
| **Logs drilldown** | `kubernetesLogsDrilldown` | `logsdrilldown.grafana.app` | `v1alpha1`, `v1beta1` | @grafana/observability-logs |
| **Query caching** | `kubernetesQueryCaching` | - | - | @grafana/operator-experience-squad |
| **Short URLs** | `kubernetesShortURLs` | `shorturl.grafana.app` | `v1beta1` | @grafana/grafana-app-platform-squad |
| **Snapshots** | `kubernetesSnapshots` | `dashboard.grafana.app` (snapshot kind) | `v0alpha1` | @grafana/grafana-app-platform-squad |
| **Stars** | `kubernetesStars` | `collections.grafana.app` | `v1alpha1` | @grafana/grafana-app-platform-squad |
| **Unified storage quotas** | `kubernetesUnifiedStorageQuotas` | `quotas.grafana.app` | `v0alpha1` | @grafana/search-and-storage |

### IAM/Authorization resources (experimental)

| Resource | Feature flag | Description |
|----------|--------------|-------------|
| Core roles | `kubernetesAuthzCoreRolesApi` | AuthZ Core Roles API |
| Global roles | `kubernetesAuthzGlobalRolesApi` | AuthZ Global Roles API |
| Roles | `kubernetesAuthzRolesApi` | AuthZ Roles API |
| Role bindings | `kubernetesAuthzRoleBindingsApi` | AuthZ Role Bindings API |
| Resource permissions | `kubernetesAuthzResourcePermissionApis` | AuthZ resource permission APIs |
| Team LBAC rules | `kubernetesAuthzTeamLBACRuleApi` | AuthZ TeamLBACRule API |
| Team bindings | `kubernetesTeamBindings` | Team bindings search |
| External group mapping | `kubernetesExternalGroupMapping` | Routes external group mapping requests |
| AuthN mutations | `kubernetesAuthnMutation` | Create, delete, and update mutations for IAM resources |

### Other apps (always registered or conditional)

| App | API group | Version | Notes |
|-----|-----------|---------|-------|
| Advisor | `advisor.grafana.app` | `v0alpha1` | Enabled with `grafanaAdvisor` flag |
| Example | `example.grafana.app` | `v0alpha1`, `v1alpha1` | Disabled by default, for development |
| Folder | `folder.grafana.app` | `v1beta1` | Core resource |
| IAM | `iam.grafana.app` | `v0alpha1` | Multiple kinds for users, teams, roles |
| Live | `live.grafana.app` | `v1alpha1` | Enabled with `liveAPIServer` flag |
| Playlist | `playlist.grafana.app` | `v0alpha1` | Always registered |
| Plugins | `plugins.grafana.app` | `v0alpha1` | Always registered |
| Preferences | `preferences.grafana.app` | `v1alpha1` | User preferences |
| Provisioning | `provisioning.grafana.app` | `v0alpha1` | GitOps provisioning |
| Secret | `secret.grafana.app` | `v1beta1` | Secrets management |

## Unified storage feature flags

These flags control the underlying storage infrastructure:

| Feature flag | Stage | Description |
|--------------|-------|-------------|
| `unifiedStorageBigObjectsSupport` | Experimental | Enables saving big objects in blob storage |
| `unifiedStorageGrpcConnectionPool` | Experimental | Enables gRPC connection pool |
| `unifiedStorageSearch` | Experimental | Enables unified storage search |
| `unifiedStorageSearchUI` | Experimental | Enables unified storage search UI |
| `unifiedStorageSearchDualReaderEnabled` | Experimental | Enable dual reader for unified storage search |

## Migration path

The migration follows these steps per resource type:

1. **Define schema:** Define the resource using CUE (Apps Approach). Introduce an Alpha version (`v0alpha1`).
2. **Implement handlers:** Create Resource API handlers (CRUD) interacting with legacy storage.
3. **Add feature flag:** Create a flag (e.g., `kubernetes<Resource>`), initially off.
4. **Implement routing/translation:** Modify Legacy API handlers to delegate calls when flag is active.
5. **Testing and promotion (Beta):** Enable the flag by default after testing. Promote API to Beta (`v1beta1`).
6. **Migrate data to Unified Storage:** Under another feature flag, change the source of truth from legacy to unified storage.
7. **Stabilization (GA):** Promote to GA (`v1`) when stable.
8. **Deprecate Legacy API:** Officially deprecate the corresponding Legacy API endpoint.
9. **Remove Legacy API:** Remove the Legacy API endpoint after the deprecation period.

## Frontend migration status

The frontend code is also updated gradually. As Resource API endpoints stabilize, frontend code managing those resources switches from Legacy to Resource APIs.

| Component | Status | Notes |
|-----------|--------|-------|
| Dashboard API | Migrated | Uses `UnifiedDashboardAPI` supporting v1 and v2 |
| Folder API | In progress | Uses app platform API with `foldersAppPlatformAPI` flag |
| Alerting | In progress | Generated OpenAPI clients for receivers, routes, time intervals |

## Recent changes

- **kubernetesDashboards:** Enabled by default (GA)
- **kubernetesClientDashboardsFolders:** Enabled by default
- **Dashboard v2:** New dashboard schema version (`v2beta1`) introduced

## Related documentation

- [Kubernetes-inspired backend architecture](./k8s-inspired-backend-arch.md)
- [Feature toggles documentation](../../docs/sources/setup-grafana/configure-grafana/feature-toggles/index.md)
- [App SDK documentation](https://github.com/grafana/grafana-app-sdk)

## How to enable experimental features

To enable an experimental feature, add the feature flag to your Grafana configuration:

```ini
[feature_toggles]
enable = kubernetesAlertingRules,kubernetesCorrelations
```

Or set the environment variable:

```sh
GF_FEATURE_TOGGLES_ENABLE=kubernetesAlertingRules,kubernetesCorrelations
```

{{< admonition type="caution" >}}
Experimental features are subject to change and may have breaking changes between versions. Use them in development or test environments only.
{{< /admonition >}}
