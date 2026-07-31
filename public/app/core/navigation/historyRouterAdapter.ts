import * as H from 'history';
// Imported from `react-router` rather than `react-router-dom` on purpose: `NavigationType` is the
// one value this module needs at import time, and plenty of tests replace `react-router-dom` with a
// partial `jest.mock`, which would make that value undefined here.
import { NavigationType, type Location as RouterLocation, type Path, type To } from 'react-router';

/**
 * The subset of `@remix-run/router`'s `History` interface that `unstable_HistoryRouter` uses.
 * Declared here rather than imported because `react-router-dom` doesn't re-export the type and
 * `@remix-run/router` is only a transitive dependency.
 */
interface RouterHistory {
  readonly action: NavigationType;
  readonly location: RouterLocation;
  createHref(to: To): string;
  createURL(to: To): URL;
  encodeLocation(to: To): Path;
  push(to: To, state?: unknown): void;
  replace(to: To, state?: unknown): void;
  go(delta: number): void;
  listen(
    listener: (update: { action: NavigationType; location: RouterLocation; delta: number | null }) => void
  ): () => void;
}

const routerActions: Record<H.Action, NavigationType> = {
  POP: NavigationType.Pop,
  PUSH: NavigationType.Push,
  REPLACE: NavigationType.Replace,
};

/**
 * `locationService.getHistory()` returns a history@4 instance (see LocationService.tsx) which is
 * kept around because a lot of app code still relies on its v4-shaped API (`.length`, `.goBack()`,
 * `.block()`, and a two-argument `listen(location, action)` callback).
 *
 * react-router-dom v6's `unstable_HistoryRouter`, on the other hand, expects a history object shaped
 * like `@remix-run/router`'s `History` interface (single-argument `listen(update)`, `go`, `createHref`,
 * `createURL`, `encodeLocation`).
 *
 * This adapter bridges the two so we can keep the history@4-based `locationService` while still using
 * a native (non-compat) react-router-dom v6 `<Router>`. It delegates every operation to the same
 * underlying history@4 instance, so the two "views" of the browser history never get out of sync.
 */
export function toHistoryRouterHistory(history: H.History): RouterHistory {
  const toLocationDescriptor = (to: To): H.LocationDescriptorObject =>
    typeof to === 'string' ? H.parsePath(to) : { pathname: to.pathname, search: to.search, hash: to.hash };

  const toRouterLocation = (location: H.Location): RouterLocation => ({
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    state: location.state,
    // history@4 only assigns keys to entries it created itself; react-router uses "default" for
    // any location that arrives without one.
    key: location.key ?? 'default',
  });

  const createHref = (to: To) => history.createHref(toLocationDescriptor(to));

  return {
    get action() {
      return routerActions[history.action];
    },
    get location() {
      return toRouterLocation(history.location);
    },
    createHref,
    createURL(to: To) {
      const base = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost';
      return new URL(createHref(to), base);
    },
    // Deliberately a pass-through rather than a `new URL(...)` round trip. react-router only calls
    // this to re-encode `match.pathname`, which it sliced out of `history.location.pathname` and so
    // is already encoded exactly as the browser wrote it. Encoding via this adapter's `createHref`
    // would also splice the basename into `match.pathname` and break matching under `appSubUrl`.
    encodeLocation(to: To) {
      const descriptor = toLocationDescriptor(to);
      return {
        pathname: descriptor.pathname ?? '',
        search: descriptor.search ?? '',
        hash: descriptor.hash ?? '',
      };
    },
    push(to: To, state?: unknown) {
      history.push(toLocationDescriptor(to), state);
    },
    replace(to: To, state?: unknown) {
      history.replace(toLocationDescriptor(to), state);
    },
    go(delta: number) {
      history.go(delta);
    },
    listen(listener: (update: { action: NavigationType; location: RouterLocation; delta: number | null }) => void) {
      return history.listen((location, action) => {
        listener({
          action: routerActions[action],
          location: toRouterLocation(location),
          // Only data routers use `delta`, and this adapter never backs one.
          delta: null,
        });
      });
    },
  };
}
