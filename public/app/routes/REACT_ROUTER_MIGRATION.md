# React Router v6 migration

This document records the completion of issue [#9](https://github.com/fieldsphere/grafana/issues/9): migrating Grafana's frontend from React Router v5 (with `react-router-dom-v5-compat`) to native React Router v6.

## What changed

- **Root shell**: Replaced v5 `Router` + `CompatRouter` with `createRouter` + `RouterProvider` in [`RoutesWrapper.tsx`](./RoutesWrapper.tsx).
- **Layout**: App chrome and providers moved to [`AppChromeLayout.tsx`](./AppChromeLayout.tsx) with an `<Outlet />` for child routes.
- **Route registration**: [`buildAppRouteObjects.tsx`](./buildAppRouteObjects.tsx) converts `RouteDescriptor[]` into data-router route objects.
- **LocationService**: [`packages/grafana-runtime/src/services/LocationService.tsx`](../../../packages/grafana-runtime/src/services/LocationService.tsx) now uses `@remix-run/router` history instead of `history@4`.
- **Unsaved changes**: [`FormPrompt`](../core/components/FormPrompt/FormPrompt.tsx) uses `useBlocker` instead of `history.block`.
- **Imports**: All `react-router-dom-v5-compat` imports replaced with `react-router-dom` v6.

## Tracking

Run the inventory script to verify migration status:

```bash
node scripts/react-router-migration-inventory.mjs
```

Expected results after migration:

| Check | Target |
|-------|--------|
| `react-router-dom-v5-compat` imports | 0 |
| `CompatRouter` usage | 0 |
| `history.block` usage | 0 |
| `useBlocker` usage | ≥ 1 |

## Remaining debt

- **`history@4` in root `package.json`**: Some files still import `history` types for legacy callers (dashboard prompts, explore tests). LocationService no longer depends on it.
- **Plugin v5 alias**: [`sharedDependencies.ts`](../features/plugins/loader/sharedDependencies.ts) exposes `react-router-dom-v5` (`npm:react-router-dom@5.3.4`) for legacy plugins that have not migrated to v6 APIs.
- **`locationService` callers**: Many features still navigate via `locationService.push`/`partial` rather than `useNavigate`. This is intentional and separate from the router version upgrade.

## Manual smoke checklist

Before merging router changes, verify:

- Auth redirects and login flow
- `appSubUrl` subpath installs
- Dashboard edit + unsaved changes modal (FormPrompt)
- Explore URL sync and split pane
- Alerting rule viewer with encoded rule IDs
- Provisioning wizard navigation
- Plugin app pages (AppRootPage)
- Public dashboard routes
