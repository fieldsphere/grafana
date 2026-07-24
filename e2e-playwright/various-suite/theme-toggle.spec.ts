import { test, expect } from '@grafana/plugin-e2e';

test.describe('Theme toggle', { tag: ['@various'] }, () => {
  test('is visible on the login page', async ({ selectors, page }) => {
    await page.goto(selectors.pages.Login.url);

    await expect(page.getByTestId(selectors.components.NavToolbar.themeToggleFloating)).toBeVisible();
    await expect(page.getByTestId(selectors.components.NavToolbar.themeToggle)).toBeVisible();
  });

  test('is visible in the top bar after login', async ({ selectors, page, grafanaAPICredentials }) => {
    await page.goto(selectors.pages.Login.url);

    await page.getByTestId(selectors.pages.Login.username).fill(grafanaAPICredentials.user);
    await page.getByTestId(selectors.pages.Login.password).fill(grafanaAPICredentials.password);
    await page.getByTestId(selectors.pages.Login.submit).click();

    if (grafanaAPICredentials.password === 'admin') {
      await page.getByTestId(selectors.pages.Login.skip).click();
    }

    await expect(page.getByTestId(selectors.components.NavToolbar.themeToggle)).toBeVisible();
  });

  test('switches theme when clicked', async ({ selectors, page, grafanaAPICredentials }) => {
    await page.goto(selectors.pages.Login.url);

    await page.getByTestId(selectors.pages.Login.username).fill(grafanaAPICredentials.user);
    await page.getByTestId(selectors.pages.Login.password).fill(grafanaAPICredentials.password);
    await page.getByTestId(selectors.pages.Login.submit).click();

    if (grafanaAPICredentials.password === 'admin') {
      await page.getByTestId(selectors.pages.Login.skip).click();
    }

    const themeToggle = page.getByTestId(selectors.components.NavToolbar.themeToggle);
    const initialLabel = await themeToggle.getAttribute('aria-label');

    await themeToggle.click();

    await expect(themeToggle).not.toHaveAttribute('aria-label', initialLabel ?? '');
  });
});
