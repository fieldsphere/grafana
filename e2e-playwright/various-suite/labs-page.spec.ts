import { test, expect } from '@grafana/plugin-e2e';

test.describe(
  'Labs page',
  {
    tag: ['@various'],
  },
  () => {
    test('shows feature flags table for admins', async ({ page }) => {
      await page.goto('/labs/feature-flags');
      await expect(page.getByRole('heading', { name: 'Feature flags' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Feature flag' })).toBeVisible();
    });
  }
);
