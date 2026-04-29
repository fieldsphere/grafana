# Work recording: GitHub issue #10

Issue: https://github.com/fieldsphere/grafana/issues/10
Branch: `cursor/CS-554-grafana-issue-resolution-ccd2`

## Classification

Bug: datasource error handling paths were incomplete or opaque.

## Plan

1. Inspect the SQL datasource macro interpolation paths for MySQL, PostgreSQL, and MSSQL.
2. Preserve macro evaluation errors and remove ignored regexp compilation paths.
3. Improve plugin metadata upstream API errors so non-200 responses include the response body detail when present.
4. Add focused tests for upstream JSON and plain-text error responses.
5. Run targeted Go tests for the touched packages.

## Implementation log

- Confirmed the repository remote targets `fieldsphere/grafana`.
- Selected issue #10 because it is the concrete open bug report matching datasource error handling.
- Updated SQL macro engines to use package-level `regexp.MustCompile` values:
  - `pkg/tsdb/mysql/macros.go`
  - `pkg/tsdb/grafana-postgresql-datasource/macros.go`
  - `pkg/tsdb/mssql/sqleng/macros.go`
- Removed stale TODO comments that claimed macro errors were ignored.
- Updated `apps/plugins/pkg/app/meta/catalog.go` to return bounded upstream response details for non-200 grafana.com API responses.
- Added tests in `apps/plugins/pkg/app/meta/catalog_test.go` for JSON and plain-text upstream error bodies.

## Verification

Command:

```bash
go test ./apps/plugins/pkg/app/meta ./pkg/tsdb/mysql ./pkg/tsdb/grafana-postgresql-datasource ./pkg/tsdb/mssql/sqleng
```

Result:

```text
ok  	github.com/grafana/grafana/apps/plugins/pkg/app/meta	0.096s
ok  	github.com/grafana/grafana/pkg/tsdb/mysql	0.008s
ok  	github.com/grafana/grafana/pkg/tsdb/grafana-postgresql-datasource	0.019s
ok  	github.com/grafana/grafana/pkg/tsdb/mssql/sqleng	0.015s
```

## Commits

- `d7d02a89ff Improve datasource error handling`

## Ticket body note

The implementation plan above is ready to copy into the GitHub issue body. The available GitHub CLI in this environment is read-only, and no separate GitHub issue update tool is exposed, so the issue body was not modified by this automation run.
