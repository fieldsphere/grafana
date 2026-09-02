---
aliases:
  - ../../../http_api/new_api_structure/ # /docs/grafana/next/http_api/new_api_structure/
  - ../../../developers/http_api/apis/ # /docs/grafana/next/developers/http_api/apis/
canonical: https://grafana.com/docs/grafana/latest/developer-resources/api-reference/http-api/apis/
description: ''
keywords:
  - grafana
  - http
  - documentation
  - api
labels:
  products:
    - enterprise
    - oss
    - cloud
title: Migrate to the new APIs
menuTitle: Migrate to new APIs
weight: 02
---

# Migrate to the new Grafana APIs

{{< admonition type="note" >}}
New APIs are available in Grafana 12 and later.
Legacy APIs are deprecated starting in Grafana 13.
{{< /admonition >}}

Grafana is migrating existing APIs to the new `/apis` model, a Kubernetes-style API layer which follows a standardized API structure alongside consistent API versioning. Refer to the [New API structure in Grafana](https://grafana.com/docs/grafana/<GRAFANA_VERSION>/developer-resources/api-reference/http-api/apis) documentation for more details.

**Legacy APIs are not being disabled for the moment**. Removal of legacy APIs is planned for a future major release, and any breaking changes will be announced well in advance to avoid disruptions.

## Search field map

`GET /api/search` is a compatibility shim. Grafana UI and new clients should call `GET /apis/dashboard.grafana.app/v0alpha1/namespaces/{namespace}/search`.

Use this field map when you move a client:

- **`type=dash-db`**: `type=dashboard`
- **`type=dash-folder`**: `type=folder`
- **`folderUIDs`**: `folder`
- **`dashboardUIDs`**: `name`
- **`sort=alpha-asc`**: `sort=title`
- **`sort=alpha-desc`**: `sort=-title`
- **`GET /api/search/sorting`**: `GET /apis/dashboard.grafana.app/v0alpha1/namespaces/{namespace}/search/sortable`
- **`starred=true`**: resolve starred UIDs first, then pass them as `name`
- **Response**: legacy returns a bare `Hit[]` array (`uid`, `type: dash-db`). The `/apis` route returns `{ totalHits, hits }` (`name`, `resource`).

`GET /api/search` stays available and still returns the legacy `Hit[]` shape so existing Terraform providers and scripts keep working.

## Library panel connections

`GET /api/library-elements/{uid}/connections` is replaced by:

`GET /apis/dashboard.grafana.app/v0alpha1/namespaces/{namespace}/librarypanels/{name}/connections`

Connections are derived from dashboard search (`libraryPanel={name}`). They aren't a stored resource.

## Organizations and membership

Org is the tenant. Every other `/apis` resource is namespaced **by** org (`org-{id}` / `stack-{id}`). Do not put Org under `iam.grafana.app`.

Behind `kubernetesOrgsApi` (experimental, off):

- `GET/POST/PUT/DELETE /apis/org.grafana.app/v0alpha1/organizations/{id}`
- `GET/POST/PUT/DELETE /apis/org.grafana.app/v0alpha1/orgmemberships/{orgId}.{userUID}`

`/api/orgs` and `/api/org/users` stay as shims. Invites stay on `/api/org/invites` until a later Invitation kind. Global org (ID 0) is grafana-admin only and does not map to a namespace.

## Signed-in user

Same entity as admin user CRUD. Session identity is request context, not a `SignedInUser` resource.

| Legacy | Target |
|--------|--------|
| `GET/PUT /api/user` | `GET/PATCH .../users/{own-uid}` |
| `GET /api/user/teams` | `users/{uid}/teams` |
| `GET /api/user/orgs` + `POST /api/user/using/:id` | `orgmemberships?fieldSelector=spec.userRef=` + `users/{uid}/context` |
| `PUT /api/user/password` | `users/{uid}/password` (hashes never enter User spec) |
| auth-tokens list/revoke | `users/{uid}/sessions` |
| `POST /api/user/auth-tokens/rotate` | cookie/session-specific; stays off the CRD |

Signup, invite-complete, and password-reset stay pre-auth `temp_user` flows.

## Live

`live.grafana.app` Channel is the config/metadata surface (path, rate limits). Subscribers stay on `GET /api/live/ws`. HTTP publish can use `POST /apis/live.grafana.app/v1alpha1/namespaces/{namespace}/publish`.

## Deprecation notes

The API migration process is underway and there may not be an exact `/apis` match to the legacy API you're using. Some legacy APIs may not be migrated at all. For details, refer to [List of available HTTP APIs](https://grafana.com/docs/grafana/<GRAFANA_VERSION>/developer-resources/api-reference/http-api#list-of-available-http-apis) table.

### Query history API

The [Query History API](https://grafana.com/docs/grafana/<GRAFANA_VERSION>/developer-resources/api-reference/http-api/api-legacy/query_history) will not be migrated.

This functionality is being deprecated. Grafana will revert to using local on-device storage for this functionality, since this approach reduces the amount of traffic to the backend with minimal change in functionality. If you're using this API, consider using a similar approach.
