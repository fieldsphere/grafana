# Angular V2 to React Migration Status

Status matrix for legacy Angular panel JSON to dashboard schema v2 conversion. Updated during the api-migrator implementation pass.

## Worker lane rules

Each lane owns backend conversion, frontend handler behavior, fixtures, and tests end to end. Do not split by layer only.

## Migration matrix

| Source ID | Target plugin | Go mapping | TS mapping | Backend fixture | Frontend handler tests | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `graph` (default) | `timeseries` | `GetGraphMigrationTarget` | `getPanelPluginToMigrateTo` | `v1beta1.angular-migrations.json` | `timeseries/migrations.test.ts` | Verified |
| `graphite` (default) | `timeseries` | same as graph | same as graph | same fixture | `timeseries/migrations.test.ts` | Verified |
| `graph` xaxis `series` | `barchart` | `GetGraphMigrationTarget` | `getPanelPluginToMigrateTo` | fixture | `barchart/migrations.test.ts` | Verified |
| `graph` xaxis `series` + legend values | `bargauge` | `GetGraphMigrationTarget` | `getPanelPluginToMigrateTo` | partial | `BarGaugeMigrations.test.ts` (6.x only) | Partial — graph-series bargauge path needs dedicated fixture |
| `graph` xaxis `histogram` | `histogram` | `GetGraphMigrationTarget` | `getPanelPluginToMigrateTo` | fixture | `histogram/migrations.test.ts` | Verified |
| `table-old` | `table` | `AngularPanelMigrations` | `autoMigrateAngular` | fixture | `table/migrations.test.ts` | Verified |
| `table` with Angular `styles` | `table` | v24 schema migration | v24 `DashboardMigrator` | `v2beta1.v24.table-angular.json` | `table/migrations.test.ts` | Verified |
| `singlestat` | `stat` | `AngularPanelMigrations` | `autoMigrateAngular` | fixture | `StatMigrations.test.ts` | Verified |
| `grafana-singlestat-panel` | `stat` | `AngularPanelMigrations` | `autoMigrateAngular` | fixture | `StatMigrations.test.ts` | Verified |
| `grafana-piechart-panel` | `piechart` | `AngularPanelMigrations` | `autoMigrateAngular` | fixture | `piechart/migrations.test.ts` | Verified |
| `grafana-worldmap-panel` | `geomap` | `AngularPanelMigrations` | `autoMigrateAngular` | fixture | `geomap/migrations.test.ts` | Verified |
| `natel-discrete-panel` | `state-timeline` | `AngularPanelMigrations` | `autoMigrateAngular` | fixture | `state-timeline/migrations.test.ts` | Verified |
| `text` (Angular root props) | `text` | `autoMigrateFrom=text` via root options | same via `buildPanelKind` | fixture | `text/textPanelMigrationHandler.test.ts` | Verified |

## Shared contract

| Contract point | Go location | TS location | Test coverage |
| --- | --- | --- | --- |
| Migration target selection | `schemaversion.GetAngularPanelMigration` | `getPanelPluginToMigrateTo` | `migration_utils_test.go`, `getPanelPluginToMigrateTo.test.ts` |
| Angular option extraction | `extractAngularOptions` in `v1_to_v2alpha1.go` | `extractAngularOptions` in `ResponseTransformers.ts` | `ResponseTransformers.angularMigration.test.ts` |
| `__angularMigration` payload | `buildVizConfigKind` conversion | `buildPanelKind` | same TS test file + conversion golden fixtures |
| Scene load strips metadata | n/a | `buildVizPanel` in `layoutSerializers/utils.ts` | `utils.test.ts` |
| Handler invocation | n/a | `getV2AngularMigrationHandler` | `angularMigration.test.ts` |

## Known gaps

- **Bargauge from graph series**: target mapping exists in Go/TS, but no dedicated graph-to-bargauge handler fixture; `BarGaugeMigrations.test.ts` covers 6.x panel option shape only.
- **Library panel references**: may not run through the same `buildPanelKind` path as inline panels; mark out of scope until a failing fixture exists.
- **Nested panels in collapsed rows**: covered indirectly by layout serializers; no dedicated Angular migration fixture.

## Tests run (implementation pass)

All targeted tests passed on 2026-06-23:

| Command | Result |
| --- | --- |
| `go test -v -short ./apps/dashboard/pkg/migration/schemaversion/... -run 'TestGetAngularPanelMigration\|TestGetGraphMigrationTarget\|TestIsAngularPanelType\|TestAngularPanelMigrationsParity'` | PASS (4 tests) |
| `go test -v -short ./apps/dashboard/pkg/migration/conversion/... -run 'TestDashboardConversionToAllVersions\|TestMigratedDashboardsConversion'` | PASS |
| Frontend contract tests (4 files, 62 tests) | PASS |
| Panel-family migration handler tests (10 files, 68 tests) | PASS |

## Lane completion summary

| Lane | Status | Notes |
| --- | --- | --- |
| A — Graph family | Complete | timeseries, barchart, histogram handlers verified; bargauge mapping verified, graph-series handler fixture still partial |
| B — Table | Complete | table-old and Angular styles covered |
| C — Singlestat/stat | Complete | singlestat and grafana-singlestat-panel covered |
| D — Pie/worldmap | Complete | piechart and geomap handlers verified |
| E — Discrete + same-type | Complete | state-timeline and text root-option spreading verified |

## Files added in this pass

- `.cursor/docs/angular-migration-scope-gate.md`
- `.cursor/docs/api-to-api-migration-status.md`
- `.cursor/docs/angular-v2-react-migration-status.md`
- `apps/dashboard/pkg/migration/schemaversion/migration_utils_test.go`
- `public/app/features/dashboard/state/getPanelPluginToMigrateTo.test.ts`
- `public/app/features/dashboard/api/ResponseTransformers.angularMigration.test.ts`
- `public/app/features/dashboard-scene/serialization/layoutSerializers/utils.test.ts` (extended)

## Intentional differences

None identified between Go and TypeScript migration target selection after parity tests were added.
