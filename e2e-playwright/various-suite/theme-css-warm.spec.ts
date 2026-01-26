import { expect, test } from '@grafana/plugin-e2e';

test(
  'Warms opposite theme CSS cache on startup',
  {
    tag: ['@various'],
  },
  async ({ page }) => {
    await page.goto('/');

    const warmLinks = page.locator('link[data-grafana-theme-warm]');
    await expect(warmLinks).toHaveCount(1);

    const warmLink = warmLinks.first();
    await expect(warmLink).toHaveAttribute('as', 'style');
    await expect(warmLink).toHaveAttribute('rel', /preload|prefetch/);
    await expect(warmLink).toHaveAttribute('data-grafana-theme-warm', /dark|light/);
  }
);

