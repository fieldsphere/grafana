import { test, expect } from '@grafana/plugin-e2e';

test.describe(
  'Labs page',
  {
    tag: ['@various'],
  },
  () => {
    test('shows Labs heading and feature flag table', async ({ page }) => {
      await page.goto('/labs');
      await expect(page.getByRole('heading', { name: 'Labs' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Feature flag' })).toBeVisible();
    });
  }
);
