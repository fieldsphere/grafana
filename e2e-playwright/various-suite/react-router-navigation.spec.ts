import { type Page } from '@playwright/test';

import { test, expect, type E2ESelectorGroups } from '@grafana/plugin-e2e';

// These tests exercise the react-router-dom v6 migration end-to-end: client-side <Link>
// navigation through the native (non-compat) router, browser back/forward syncing with the
// history@4-backed locationService via the historyRouterAdapter shim, deep-linking straight to
// a nested route, and the FormPrompt/Prompt "unsaved changes" blocker that still relies on
// `history.block` rather than `useBlocker` (see Prompt.tsx for why).

// Wide enough that the mega menu can be docked open, but the docked state comes from user
// preferences, so `clickMegaMenuLink` still opens it explicitly when it isn't showing.
test.use({ viewport: { width: 1280, height: 800 } });

// Local `yarn start` serves a ~33MB app bundle; cold boots routinely exceed the global 10s expect
// timeout even though the page is healthy. Scoped waits below cover that without raising every
// assertion in the suite.
const PAGE_READY = 120_000;

const hasPathname = (expected: string) => (url: URL) => url.pathname === expected;

async function waitForAppReady(page: Page) {
  // Wait for the boot preloader to go away. Do NOT wait for every role="status" named
  // "Loading" to disappear - dashboard/panel spinners reuse that accessible name and can
  // linger (or stick forever if a plugin panel is slow), which is unrelated to router readiness.
  await expect(page.locator('.preloader')).toHaveCount(0, { timeout: PAGE_READY });
  await expect(page.locator('.grafana-app')).toBeVisible({ timeout: PAGE_READY });
}

async function gotoHome(page: Page, selectors: E2ESelectorGroups) {
  await page.goto('/');
  await waitForAppReady(page);
  // Home chrome is enough to prove the route resolved; the blog panel can take much longer
  // while plugin panels load and is not what these router tests are about.
  await expect(page.getByTestId(selectors.components.NavToolbar.container)).toBeVisible({ timeout: PAGE_READY });
}

async function clickMegaMenuLink(page: Page, selectors: E2ESelectorGroups, name: string) {
  // Scope to the mega menu - breadcrumbs and other chrome also expose links with the same name.
  const megaMenu = page.getByTestId(selectors.components.NavMenu.Menu);
  const link = megaMenu.getByRole('link', { name, exact: true });

  // Prefer a short expect() over locator.isVisible(): while Chromium is still parsing the
  // local webpack app bundle, bare isVisible() CDP calls can hang until the whole test
  // timeout instead of resolving false quickly.
  try {
    await expect(link).toBeVisible({ timeout: 5_000 });
  } catch {
    await page.getByTestId(selectors.components.NavBar.Toggle.button).click();
    await expect(link).toBeVisible({ timeout: PAGE_READY });
  }

  await link.click();
}

test.describe(
  'React Router v6 navigation',
  {
    tag: ['@various'],
  },
  () => {
    test.describe.configure({ timeout: 240_000 });

    test('clicking a nav link navigates client-side without a full page reload', async ({ page, selectors }) => {
      await gotoHome(page, selectors);

      // Mark the current document instance so we can prove no full page reload happens -
      // a full reload (e.g. because <Link> fell back to a plain <a> navigation, which is
      // exactly what happens if the router context is ever duplicated/broken) would wipe it.
      await page.evaluate(() => {
        (window as unknown as { __e2eNavMarker?: boolean }).__e2eNavMarker = true;
      });

      await clickMegaMenuLink(page, selectors, 'Dashboards');

      // URL is the router invariant - assert it before waiting on lazy page chrome so a slow
      // browse-dashboards fetch can't mask a failed client-side navigation.
      await expect(page).toHaveURL(hasPathname('/dashboards'), { timeout: PAGE_READY });
      await expect(page.getByTestId(selectors.pages.BrowseDashboards.table.body)).toBeVisible({ timeout: PAGE_READY });

      const markerSurvived = await page.evaluate(
        () => (window as unknown as { __e2eNavMarker?: boolean }).__e2eNavMarker === true
      );
      expect(markerSurvived).toBe(true);
    });

    test('browser back and forward navigate correctly across client-side route changes', async ({
      page,
      selectors,
    }) => {
      const navToolbar = page.getByTestId(selectors.components.NavToolbar.container);
      const dashboardsTable = page.getByTestId(selectors.pages.BrowseDashboards.table.body);
      const exploreContainer = page.getByTestId(selectors.pages.Explore.General.container);

      await gotoHome(page, selectors);

      // Navigate via the mega menu rather than page.goto so the history entries are created by
      // the router itself - that's what back/forward has to unwind through the adapter.
      await clickMegaMenuLink(page, selectors, 'Dashboards');
      await expect(dashboardsTable).toBeVisible({ timeout: PAGE_READY });

      await clickMegaMenuLink(page, selectors, 'Explore');
      await expect(exploreContainer).toBeVisible({ timeout: PAGE_READY });

      await page.goBack();
      await expect(dashboardsTable).toBeVisible({ timeout: PAGE_READY });
      await expect(page).toHaveURL(hasPathname('/dashboards'));

      await page.goBack();
      await expect(navToolbar).toBeVisible({ timeout: PAGE_READY });
      await expect(page).toHaveURL(hasPathname('/'));

      await page.goForward();
      await expect(dashboardsTable).toBeVisible({ timeout: PAGE_READY });
      await expect(page).toHaveURL(hasPathname('/dashboards'));

      await page.goForward();
      await expect(exploreContainer).toBeVisible({ timeout: PAGE_READY });
    });

    test('deep-linking directly to a nested dashboard route renders correctly', async ({
      page,
      gotoDashboardPage,
      request,
    }) => {
      const response = await request.post('/api/dashboards/db', {
        data: {
          dashboard: {
            title: 'React Router Deep Link Test Dashboard',
            panels: [{ id: 1, title: 'Test Panel', type: 'timeseries', gridPos: { x: 0, y: 0, w: 12, h: 8 } }],
          },
          overwrite: true,
        },
      });
      const body = await response.json();
      const dashboardUID: string = body.uid;

      try {
        await gotoDashboardPage({ uid: dashboardUID });
        await waitForAppReady(page);
        await expect(page.getByText('React Router Deep Link Test Dashboard')).toBeVisible({ timeout: PAGE_READY });

        // Deep-link straight to the settings sub-route rather than clicking through -
        // this only works if the top-level <Routes>/<Route path> matching still resolves
        // correctly on initial load with the native v6 router.
        await page.goto(`/d/${dashboardUID}/react-router-deep-link-test-dashboard?editview=settings`);
        await waitForAppReady(page);

        const titleInput = page.getByLabel('Title');
        await expect(titleInput).toBeVisible({ timeout: PAGE_READY });
        await expect(titleInput).toHaveValue('React Router Deep Link Test Dashboard');
      } finally {
        await request.delete(`/api/dashboards/uid/${dashboardUID}`).catch(() => undefined);
      }
    });

    test('unsaved changes prompt blocks and then allows navigating away from a dirty dashboard', async ({
      page,
      selectors,
      gotoDashboardPage,
      request,
    }) => {
      const response = await request.post('/api/dashboards/db', {
        data: {
          dashboard: {
            title: 'React Router Unsaved Changes Test Dashboard',
            panels: [{ id: 1, title: 'Test Panel', type: 'timeseries', gridPos: { x: 0, y: 0, w: 12, h: 8 } }],
          },
          overwrite: true,
        },
      });
      const body = await response.json();
      const dashboardUID: string = body.uid;

      try {
        const dashboardPage = await gotoDashboardPage({ uid: dashboardUID });
        await waitForAppReady(page);

        await dashboardPage.getByGrafanaSelector(selectors.components.NavToolbar.editDashboard.editButton).click();
        await expect(
          dashboardPage.getByGrafanaSelector(selectors.components.NavToolbar.editDashboard.exitButton)
        ).toBeVisible({ timeout: PAGE_READY });

        // Open settings via the deep-link rather than the toolbar gear - the gear is not always
        // present in the scene edit toolbar, but `editview=settings` is the same route matching
        // the deep-link test already covers.
        await page.goto(`/d/${dashboardUID}/react-router-unsaved-changes-test-dashboard?editview=settings`);
        await waitForAppReady(page);

        const titleInput = page.getByLabel('Title');
        await expect(titleInput).toBeVisible({ timeout: PAGE_READY });
        await titleInput.fill('React Router Unsaved Changes Test Dashboard (edited)');
        // Blur so the controlled state commits before we leave the settings view.
        await titleInput.blur();

        const backToDashboard = page.getByRole('button', { name: /back to dashboard/i });
        await expect(backToDashboard).toBeVisible({ timeout: PAGE_READY });
        await backToDashboard.click();

        // The change-tracker diff runs in a Web Worker, so isDirty flips asynchronously. Wait for
        // Exit edit to be available before navigating away - otherwise we race the worker and the
        // prompt never fires, which would make this test silently pass for the wrong reason.
        await expect(
          dashboardPage.getByGrafanaSelector(selectors.components.NavToolbar.editDashboard.exitButton)
        ).toBeVisible({ timeout: PAGE_READY });

        // Navigate away via a real <Link> click (not the "Exit edit" button) so this
        // specifically exercises `history.block` intercepting react-router navigation
        // through the HistoryRouter adapter, rather than the beforeunload handler.
        await clickMegaMenuLink(page, selectors, 'Dashboards');

        await expect(page.getByRole('heading', { name: 'Unsaved changes' })).toBeVisible({ timeout: PAGE_READY });
        await expect(page).not.toHaveURL(hasPathname('/dashboards'));

        await page.getByRole('button', { name: 'Discard' }).click();

        await expect(page.getByTestId(selectors.pages.BrowseDashboards.table.body)).toBeVisible({
          timeout: PAGE_READY,
        });
        await expect(page).toHaveURL(hasPathname('/dashboards'));
      } finally {
        await request.delete(`/api/dashboards/uid/${dashboardUID}`).catch(() => undefined);
      }
    });
  }
);
