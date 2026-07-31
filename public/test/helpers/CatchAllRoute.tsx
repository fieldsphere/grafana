import { type PropsWithChildren } from 'react';
import { Route, Routes } from 'react-router-dom';

/**
 * Mounts `children` under a catch-all route so that they behave the same way they do in the app.
 *
 * The app's route table always ends in a `/*` catch-all (see `routes.tsx`), but tests typically
 * render either no `<Routes>` at all or one scoped to the feature under test. Without a catch-all
 * ancestor, navigating anywhere the test hasn't declared makes react-router log its dev-only
 * "No routes matched location" warning, which `jest-fail-on-console` turns into a failure even
 * though the app itself would have rendered `PageNotFound` and never warned.
 *
 * `<CompatRouter>` used to provide this implicitly before the react-router v6 migration.
 */
export function CatchAllRoute({ children }: PropsWithChildren) {
  return (
    <Routes>
      <Route path="*" element={children} />
    </Routes>
  );
}
