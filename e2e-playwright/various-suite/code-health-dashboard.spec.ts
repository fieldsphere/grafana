import { expect, test } from '@grafana/plugin-e2e';

/**
 * Executable demo walkthrough for the Code health dashboard (CURSOR-27).
 *
 * Run (with Grafana reachable, default admin auth from plugin-e2e):
 *   yarn playwright test e2e-playwright/various-suite/code-health-dashboard.spec.ts --project various
 */
test.describe(
  'Code health dashboard',
  {
    tag: ['@various'],
  },
  () => {
    test('demo: renders mock workspace metrics and updates when the reporting window changes', async ({ page }) => {
      await page.goto('/code-health');

      await expect(page.getByText(/mock signals for demos/i)).toBeVisible();
      await expect(page.getByText(/reporting window/i)).toBeVisible();

      await expect(page.getByTestId('code-health-card-lint')).toBeVisible();
      await expect(page.getByTestId('code-health-card-typescript')).toBeVisible();
      await expect(page.getByTestId('code-health-card-flaky')).toBeVisible();
      await expect(page.getByTestId('code-health-card-coverage')).toBeVisible();
      await expect(page.getByTestId('code-health-card-deps')).toBeVisible();
      await expect(page.getByTestId('code-health-card-ci')).toBeVisible();

      await expect(page.getByText(/lint backlog by tier/i)).toBeVisible();
      await expect(page.getByText(/quality trend snapshot/i)).toBeVisible();
      await expect(page.getByText(/prioritized recommendations/i)).toBeVisible();

      const ciCard = page.getByTestId('code-health-card-ci');
      await expect(ciCard).toContainText('96%');

      await page.getByRole('radio', { name: /^7 days$/ }).click();

      await expect(ciCard).toContainText('92%');
      await expect(page.getByRole('radio', { name: /^7 days$/ })).toBeChecked();
    });
  }
);
