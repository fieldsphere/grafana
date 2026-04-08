# React Router migration notes (CS-516 pilot)

## Pilot change

- **`public/app/features/datasources/components/DataSourcesList.tsx`**: `DataSourcesListView` uses `useLocation` from `react-router-dom` instead of `react-router-dom-v5-compat`. Behavior is unchanged (same history instance via `Router` + `CompatRouter` in `RoutesWrapper`).

## Remaining blockers for full migration

1. **App shell still uses v5-compat and history v4**  
   `RoutesWrapper.tsx` wraps the tree in `Router` from `react-router-dom` with `locationService.getHistory()` and `CompatRouter`. Route descriptors still assume v5-style matching (`Switch`-like ordering is documented in `routes.tsx`).

2. **Widespread `react-router-dom-v5-compat` imports**  
   Many files import hooks and components from `react-router-dom-v5-compat`. Replacing them wholesale requires coordinated updates and test mock paths (`jest.mock('react-router-dom-v5-compat', ...)`).

3. **`RouteDescriptor` types**  
   `public/app/core/navigation/types.ts` imports `Params` from `react-router-dom-v5-compat` and `Location` from `history`. Aligning types with pure v6 APIs should wait until the router shell no longer depends on the compat layer.

4. **`Navigate` and nested routing**  
   Top-level routes in `routes.tsx` still use compat `Navigate`, `useParams`, and `useLocation` for redirects and helpers (for example datasource to connections redirects). Migrating those touches core routing and permission-gated routes.

## Suggested follow-ups

- Incrementally swap feature-area imports from `react-router-dom-v5-compat` to `react-router-dom` where only v6 APIs are used (`useLocation`, `useParams`, `Routes`, `Route`, `Navigate`).
- Plan a phase to replace `CompatRouter` and v5 `Router` + `history` with a v6 data router or `BrowserRouter` equivalent, after auditing `locationService` usage.
- Add an ESLint rule or codemod to discourage new `react-router-dom-v5-compat` imports outside the routing shell.
