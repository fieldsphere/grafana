import { test, expect } from '@grafana/plugin-e2e';

test.describe(
  'Labs page',
  {
    tag: ['@various'],
  },
  () => {
    test('lists registered feature flags', async ({ page }) => {
      await page.goto('/labs');

      await expect(page.getByRole('columnheader', { name: 'Flag' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Enabled' })).toBeVisible();
    });
  }
);
