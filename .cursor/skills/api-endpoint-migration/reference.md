# API Endpoint Migration Reference

## OpenAPI Comment Patterns

From `pkg/api/search.go` and `pkg/api/dashboard_snapshot.go`:

```go
// swagger:route GET /path/to/endpoint tag operationId
//
// Brief description.
//
// Responses:
// 200: responseName
// 401: unauthorisedError
// 403: forbiddenError
// 500: internalServerError
func (hs *HTTPServer) HandlerName(c *contextmodel.ReqContext) response.Response { ... }
```

For parameters and response types:
```go
// swagger:parameters operationId
// swagger:response responseName
```

For `/apis` group migrations: ensure `GetOpenAPIDefinitions()` in `pkg/registry/apis/<domain>/` or `apps/<domain>/`, and add group to `pkg/tests/apis/openapi_test.go`.

## Unit Test Patterns

From `pkg/api/search_test.go`:

- `SetupAPITestServer(t, func(hs *HTTPServer) { ... })` for mocks
- `webtest.RequestWithSignedInUser(server.NewGetRequest("/api/..."), userWithPermissions(...))` for auth
- Test: 200 success, 401/403 auth, 400/422 validation, 500 errors
- Mock services: `hs.SearchService = &mockSearchService{...}`

Run: `go test -run TestName ./pkg/api/`

## Migration Status Doc

File: `docs/sources/developers/api-to-apis-migration-status.md`

Format: path, method, status (Completed/In progress/Blocked), feature toggle, source file refs.
