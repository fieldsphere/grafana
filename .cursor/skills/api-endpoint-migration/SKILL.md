---
name: api-endpoint-migration
description: Migrate a single Grafana API endpoint with OpenAPI comments, unit tests, and migration status updates. Use when migrating endpoints to the new /apis group or adding swagger docs.
---

# API Endpoint Migration

## Quick Start

When migrating one endpoint:

1. **Identify** the handler, route path, HTTP method, and DTOs
2. **Add OpenAPI comments** to the handler and types
3. **Add unit tests** in `pkg/api/<handler>_test.go`
4. **Update** `docs/sources/developers/api-to-apis-migration-status.md`

## Workflow

1. Locate handler in `pkg/api/*.go` and registration in `pkg/api/api.go`
2. Add swagger comments (see [reference.md](reference.md))
3. Create/extend tests using `SetupAPITestServer` (see [reference.md](reference.md))
4. Run `go test ./pkg/api/ -run TestName`
5. Update migration status doc
6. Run `make lint-go`

## Constraints

- Migrate one endpoint per invocation
- Do not remove legacy paths; migration coexists with feature toggles
- Business logic stays in `pkg/services/`; handlers delegate

## Additional Resources

- For OpenAPI comment patterns and test examples, see [reference.md](reference.md)
- For migration status format, see [reference.md](reference.md)
