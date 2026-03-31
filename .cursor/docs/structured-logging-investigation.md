# Structured logging investigation

## Scope

This investigation accounts for:

- frontend application code under `public/app`
- shared frontend packages under `packages`
- Swagger UI code under `public/swagger`
- backend raw stdout/stderr style logging under `pkg`

It excludes tests, Storybook stories, MDX docs, build output, generated code, vendored code, and `public/test`.

## Executive summary

- Backend logging is already mostly structured. The standard path is `pkg/infra/log`, and `slog.Default()` is bridged into that logger by `pkg/infra/log/slogadapter`.
- Frontend structured logging exists, but only for code that can import `@grafana/runtime`. The main API is `createMonitoringLogger()` and the `logInfo` / `logWarning` / `logDebug` / `logError` helpers.
- The remaining unstructured logging surface is mostly frontend console usage. After excluding tests, stories, docs, and build artifacts, the application still has 534 `console.*` calls across 336 files.
- A full migration cannot be done safely with a blind codemod. Many remaining logs are in shared packages that are not allowed to import `@grafana/runtime`, and some console output is intentionally developer-facing.

## Existing structured logging paths

### Backend

- `pkg/infra/log/log.go` is the main structured logger. It writes key/value pairs with levels and supports contextual attributes.
- `pkg/infra/log/slogadapter/adapter.go` sets `slog.Default()` to a handler backed by `pkg/infra/log`, so newer Go code can use `slog` and still emit through Grafana's structured logger.

### Frontend

- `packages/grafana-runtime/src/utils/logging.ts` exposes `logInfo`, `logWarning`, `logDebug`, `logError`, `logMeasurement`, and `createMonitoringLogger(source, defaultContext?)`.
- Those helpers send logs and errors through Faro and only emit when `config.grafanaJavascriptAgent.enabled` is true.
- `packages/grafana-ui/src/utils/logger.ts` is not a production structured logger. It is a developer-only `console.log` wrapper gated behind `localStorage.grafana.debug`.
- `packages/grafana-sql/src/utils/logging.ts` shows the intended frontend pattern: feature code creates a source-scoped monitoring logger with `createMonitoringLogger()`.

## Inventory results

The inventory was produced by scanning for `console.log`, `console.info`, `console.warn`, `console.error`, and `console.debug` in frontend sources, then separately scanning Go code for `fmt.Print*`, `log.Print*`, and `os.Stderr.WriteString`.

### Frontend runtime counts

| Area | Files with matches | Total calls | `log` | `info` | `warn` | `error` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `public/app` | 280 | 446 | 73 | 2 | 103 | 268 |
| `packages` | 53 | 78 | 18 | 0 | 24 | 36 |
| `public/swagger` | 3 | 10 | 7 | 0 | 3 | 0 |
| Total | 336 | 534 | 98 | 2 | 130 | 304 |

### Backend raw stdout/stderr counts

- `pkg` contains 154 files with 309 raw stdout/stderr-style matches before filtering for intent.
- Most of those are not request-path production logging. They are primarily tests, build tooling, code generation helpers, wire fixtures, CLI commands, and startup diagnostics.
- The notable runtime outlier found in regular package code is `pkg/services/live/pipeline/devdata.go`, which uses `log.Println` to print generated dev data.

## What is actually left to migrate

The remaining unstructured logging falls into four buckets.

### 1. Production diagnostics in app code

This is the largest bucket. It includes real runtime error and warning reporting in `public/app`, for example:

- boot and initialization failures
- API request failures
- invalid response parsing
- dashboard serialization and migration problems
- plugin and datasource query failures
- alerting, variables, and explore error paths

These should move to structured logging first because they represent true runtime diagnostics.

### 2. Debug-only or developer-facing console output

This bucket should not be migrated blindly because some of it is intentional local debugging behavior.

Examples:

- `public/app/core/utils/debugLog.ts`
- `packages/grafana-ui/src/utils/logger.ts`
- `public/app/core/services/echo/backends/analytics/BrowseConsoleBackend.ts`
- feature-toggle override logging in `packages/grafana-runtime/src/config.ts`
- profiling and scene debugging logs
- unconditional `console.log` calls in live panels, dashboard scene code, Loki query splitting, canvas connections, and similar debugging paths

Some of these should stay console-based but become explicitly gated. Others are likely leftover debug logs and should simply be removed.

### 3. Shared package diagnostics

This is the main migration blocker.

Many remaining logs live in `packages/grafana-data`, `packages/grafana-ui`, `packages/grafana-prometheus`, `packages/grafana-runtime`, and `packages/grafana-i18n`. Those packages cannot all import `@grafana/runtime`; the repository ESLint config explicitly forbids `@grafana/runtime` imports from library packages such as `packages/grafana-ui` and `packages/grafana-data`.

That means the frontend does not yet have one logging abstraction that works across both:

- app code that can use runtime/Faro directly
- shared library code that must stay runtime-agnostic

Without solving that abstraction gap first, a repo-wide migration will either fail linting or introduce layering violations.

### 4. Swagger and tooling surfaces

`public/swagger` still uses raw console logging, but this is a developer-oriented documentation surface rather than the main application shell. It should not block the main application migration.

## Recommended migration plan

### Phase 1: clean up unconditional debug logs in app code

Start with the low-risk `console.log` calls in `public/app` that are clearly leftover debug output rather than real diagnostics.

Examples include:

- scene rendering and layout debug logs
- live panel publish/debug logs
- fetch queue stats
- query splitting debug messages
- canvas connection debug output

These should be either removed or moved behind explicit debug gates.

### Phase 2: migrate application diagnostics in `public/app` to structured logging

For code under `public/app` and plugin code that can import `@grafana/runtime`, standardize on:

- `createMonitoringLogger('feature.source')` for feature-scoped loggers
- `logError(error, context)` for error paths
- `logWarning(message, context)` and `logInfo(message, context)` where the log is not an exception

Each logger should include a stable source string and enough context to replace the information currently only visible in the console.

### Phase 3: introduce a package-safe logging abstraction

Do not attempt to convert `packages/*` directly to `@grafana/runtime`.

Instead, add one small abstraction that shared packages can depend on without importing runtime. The minimal safe options are:

1. a new lightweight logging package that defines a browser logging interface and optional sink registration
2. a shared logger interface in an existing neutral package, with the app layer wiring a Faro-backed implementation

Until that exists, keep package-level migrations out of scope.

### Phase 4: add enforcement

Once Phases 1 through 3 are in place, add lint enforcement for application code:

- disallow raw `console.*` in `public/app`
- keep narrow allowlists for intentional developer-only files
- continue to exempt tests, Storybook, docs, and build tooling

This is important because the current lint setup still allows `console.error`, `console.log`, `console.warn`, and `console.info`, so regressions will keep reappearing otherwise.

## Recommendation

Do not rewrite every console call in one pass.

The lowest-risk path is:

1. remove or gate the obvious debug `console.log` calls in `public/app`
2. migrate real application diagnostics in `public/app` and core plugins to `createMonitoringLogger()`
3. design a package-safe abstraction before touching `packages/*`
4. add lint enforcement after the migration path exists

That approach accounts for all current logs without breaking layering rules or changing developer-only workflows that still rely on the browser console.
