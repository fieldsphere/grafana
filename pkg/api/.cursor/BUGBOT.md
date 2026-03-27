# BUGBOT Review Rules — `pkg/api/`

This file provides context for automated code reviewers operating on the Grafana HTTP API layer.

## Package Role

`pkg/api/` is the HTTP façade for Grafana. Handlers here should be thin: bind the request, check authorization, delegate to a service in `pkg/services/`, and return a `response.Response`. Business logic must not live in this package.

## Route Registration

- All routes are registered in `registerRoutes()` inside `api.go` via `hs.RouteRegister`.
- New feature areas should define a `register*API(apiRoute routing.RouteRegister)` function and call it from `registerRoutes()`.
- Duplicate `(method, pattern)` pairs panic at startup — flag any PR that could introduce one.

## Authentication & Authorization

### What to verify on every new or changed route

1. **Auth middleware is present.** Every route must have at least one of:
   - `middleware.ReqSignedIn` / `ReqSignedInNoAnonymous` / `ReqGrafanaAdmin`
   - `authorize(ac.EvalPermission(...))` or `authorizeInOrg(...)` for RBAC
   - An explicit `middleware.NoAuth` (only acceptable for truly public endpoints like health, login, public snapshots, static assets)
2. **RBAC scopes use parameterized IDs, not raw values.** Correct: `ac.ScopeProvider.GetResourceScopeUID(ac.Parameter(":uid"))`. Incorrect: hard-coded scope strings that skip the parameter resolver.
3. **Org-scoped authorization** uses `authorizeInOrg` when the target org differs from the signed-in user's active org.
4. **Anonymous / `NoAuth` routes are intentional.** Any addition or removal of `NoAuth` is security-sensitive and needs explicit justification.

### Common mistakes

- Adding a route without any auth middleware (defaults to no enforcement on that route).
- Using `ReqSignedIn` when fine-grained RBAC is required — the route becomes accessible to any authenticated user regardless of role.
- Forgetting to add corresponding fixed-role declarations in `accesscontrol.go` when introducing new RBAC-gated routes.

## Request Handling

### Binding & validation

- Request bodies: `web.Bind(c.Req, &cmd)` with DTO types from `pkg/api/dtos/`.
- Path params: `web.Params(c.Req)[":param"]`.
- Validate inputs early (UID format, required fields) before calling service methods. Use domain `errutil` errors, not raw `fmt.Errorf`.

### Things to flag

- **Unbounded input** — missing pagination (`perpage`, `limit`) on list endpoints; missing length limits on string fields.
- **Numeric ID confusion** — the codebase is migrating from numeric IDs to UIDs. New code should prefer UIDs. Watch for routes accepting `:id` when they should accept `:uid`, or vice versa.
- **`middlewareUserUIDResolver`** converts `:id`/`:userId` from UID to numeric internally. Misuse (applying it to a route that already expects numeric) breaks the endpoint.

## Response & Error Handling

### Preferred patterns

- `response.JSON(http.StatusOK, dto)` for success.
- `response.Err(err)` for `errutil`-based errors — automatically maps to the correct HTTP status and public message.
- `response.ErrOrFallback(status, message, err)` when the error may not implement `errutil.Error`.
- Domain error mappers (e.g., `apierrors.ToFolderErrorResponse`) for complex service-to-HTTP mappings.

### Things to flag

- **Leaking internal error details.** `response.Error(status, err.Error(), err)` exposes the raw Go error in the JSON body. Use `response.Err(err)` with a domain error that has a safe public message, or pass a static string.
- **Wrong HTTP status codes.** 404 for auth failures (should be 403 or 401), 500 for client errors, 200 for failures.
- **Missing `context.Canceled` handling.** Long-running proxy/query endpoints should propagate cancellation correctly — `response.ErrOrFallback` handles this; direct `response.Error` does not.

## Proxy & Data Source Endpoints

These are the highest-risk surface in `pkg/api/`:

| Area | Key Risk |
|------|----------|
| `pluginproxy/` (DataSourceProxy) | SSRF — server-side requests to user-controlled URLs. `validateRequest()` and `datasource.ValidateURL()` are the guardrails. |
| `dataproxy.go` | Plugin resource requests. Verify the target datasource is accessible to the requesting user/org. |
| `grafana_com_proxy.go` | Outbound proxy to grafana.com — URL construction must not allow path traversal. |
| `/api/ds/query` | Query execution path. Auth is enforced, but watch for query parameter injection or scope bypass. |
| `/api/plugins/:pluginId/resources` | Plugin resource proxy. `checkAppEnabled` must be called; plugin ID must be validated. |

Flag any change that:
- Modifies URL construction or validation in proxy paths.
- Adds new outbound HTTP calls without URL allow-listing or validation.
- Passes user-controlled data into `http.NewRequest` URLs without sanitization.

## Testing Expectations

- **New endpoints need tests.** Use `SetupAPITestServer` (full route table) or `setupSimpleHTTPServer` (minimal) from `common_test.go`.
- **Auth tests are required.** At minimum, verify that unauthenticated requests are rejected and that RBAC permissions are enforced (test with `userWithPermissions` / `authedUserWithPermissions`).
- **Proxy tests** should cover both valid and malicious URL inputs.
- Test helpers: `loggedInUserScenario`, `anonymousUserScenario`, `fakeReqWithParams`, `mockRequestBody`.

## Security Checklist for PRs

- [ ] Every new route has explicit auth middleware
- [ ] RBAC permissions use correct action strings and parameterized scopes
- [ ] New fixed roles are declared in `accesscontrol.go` if needed
- [ ] Error responses do not leak internal error messages or stack traces
- [ ] User-supplied strings used in URLs are validated/sanitized
- [ ] List endpoints have pagination or result-count limits
- [ ] No raw SQL in handlers — all data access goes through service/store layers
- [ ] New or modified DTOs have appropriate JSON tags and validation
- [ ] Tests cover the happy path, auth rejection, and at least one error case

## Structural Red Flags

- **Business logic in handlers.** If a handler does more than bind → validate → delegate → respond, the logic likely belongs in `pkg/services/`.
- **Direct database access.** Handlers must not import `sqlstore` or execute SQL. All persistence goes through service interfaces.
- **Feature flag checks without fallback.** When gating behind `featuremgmt`, ensure the non-flagged path still works or returns a clear 404/501.
- **Large PRs touching `api.go`'s `registerRoutes()`.** This function is a critical choke point — conflicts are common and misordered middleware causes subtle auth bugs.
