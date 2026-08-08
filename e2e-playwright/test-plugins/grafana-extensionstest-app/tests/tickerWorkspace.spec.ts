import { expect, test } from '@grafana/plugin-e2e';

import pluginJson from '../plugin.json';
import { testIds } from '../testIds';

test.use({
  video: 'on',
});

test.describe(
  'grafana-extensionstest-app ticker workspace',
  {
    tag: ['@plugins'],
  },
  () => {
    test('supports persistent watchlist, favorites, recent searches, and comparison', async ({ page }) => {
      await page.goto(`/a/${pluginJson.id}/ticker-workspace`);

      const searchInput = page.getByTestId(testIds.tickerWorkspace.searchInput);
      const addButton = page.getByTestId(testIds.tickerWorkspace.addButton);

      await searchInput.fill('AAPL');
      await addButton.click();
      await expect(page.getByTestId(`${testIds.tickerWorkspace.watchlistItemPrefix}AAPL`)).toBeVisible();

      await searchInput.fill('MSFT');
      await addButton.click();
      await expect(page.getByTestId(`${testIds.tickerWorkspace.watchlistItemPrefix}MSFT`)).toBeVisible();

      await page.getByTestId(`${testIds.tickerWorkspace.favoriteButtonPrefix}AAPL`).click();
      await expect(page.getByTestId(`${testIds.tickerWorkspace.favoriteQuickButtonPrefix}AAPL`)).toBeVisible();

      await page.getByTestId(`${testIds.tickerWorkspace.compareCheckboxPrefix}AAPL`).check();
      await page.getByTestId(`${testIds.tickerWorkspace.compareCheckboxPrefix}MSFT`).check();

      await expect(page.getByTestId(testIds.tickerWorkspace.comparisonGrid)).toBeVisible();
      await expect(page.getByTestId(`${testIds.tickerWorkspace.comparisonCardPrefix}AAPL`)).toBeVisible();
      await expect(page.getByTestId(`${testIds.tickerWorkspace.comparisonCardPrefix}MSFT`)).toBeVisible();

      await expect(page.getByTestId(`${testIds.tickerWorkspace.recentSearchButtonPrefix}AAPL`)).toBeVisible();
      await expect(page.getByTestId(`${testIds.tickerWorkspace.recentSearchButtonPrefix}MSFT`)).toBeVisible();

      await page.reload();

      await expect(page.getByTestId(`${testIds.tickerWorkspace.watchlistItemPrefix}AAPL`)).toBeVisible();
      await expect(page.getByTestId(`${testIds.tickerWorkspace.watchlistItemPrefix}MSFT`)).toBeVisible();
      await expect(page.getByTestId(`${testIds.tickerWorkspace.favoriteQuickButtonPrefix}AAPL`)).toBeVisible();
      await expect(page.getByTestId(`${testIds.tickerWorkspace.comparisonCardPrefix}AAPL`)).toBeVisible();
      await expect(page.getByTestId(`${testIds.tickerWorkspace.comparisonCardPrefix}MSFT`)).toBeVisible();

      await page.screenshot({
        path: 'e2e-playwright/test-plugins/grafana-extensionstest-app/artifacts/cur-58-ticker-workspace.png',
        fullPage: true,
      });
    });
  }
);
