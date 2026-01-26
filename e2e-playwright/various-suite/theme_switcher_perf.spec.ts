import fs from 'fs';
import * as prom from 'prom-client';

import { test, expect } from '@grafana/plugin-e2e';

declare global {
  interface Window {
    __themeSwitcherPerf?: {
      longTasks: number[];
      lastLongTaskTs: number;
    };
  }
}

async function resetPerf(page: any) {
  await page.evaluate(() => {
    if (!window.__themeSwitcherPerf) {
      window.__themeSwitcherPerf = { longTasks: [], lastLongTaskTs: performance.now() };
      // Long task API is Chromium-only and may not exist in all browsers.
      // In our default Playwright project we run in Chromium.
      // eslint-disable-next-line no-new
      new PerformanceObserver((list) => {
        const now = performance.now();
        for (const entry of list.getEntries()) {
          // @ts-expect-error - duration exists on PerformanceEntry for longtask
          window.__themeSwitcherPerf!.longTasks.push(entry.duration);
          window.__themeSwitcherPerf!.lastLongTaskTs = now;
        }
      }).observe({ entryTypes: ['longtask'] as any });
    } else {
      window.__themeSwitcherPerf.longTasks = [];
      window.__themeSwitcherPerf.lastLongTaskTs = performance.now();
    }
  });
}

async function measureThemeInteractionToIdle(page: any, action: () => Promise<void>) {
  await resetPerf(page);
  const start = await page.evaluate(() => performance.now());

  await action();

  // Wait until we haven't seen a long task for a short window.
  // This approximates "the UI feels responsive again" after the theme switch work completes.
  await page.waitForFunction(() => {
    if (!window.__themeSwitcherPerf) {
      return true;
    }
    return performance.now() - window.__themeSwitcherPerf.lastLongTaskTs > 200;
  });

  // Give React/layout one more frame to settle.
  await page.evaluate(() => new Promise(requestAnimationFrame));

  const end = await page.evaluate(() => performance.now());
  const longTasks = (await page.evaluate(() => window.__themeSwitcherPerf?.longTasks ?? [])) as number[];

  const totalLongTaskMs = longTasks.reduce((acc, v) => acc + v, 0);
  const maxLongTaskMs = longTasks.length ? Math.max(...longTasks) : 0;

  return {
    durationMs: end - start,
    totalLongTaskMs,
    maxLongTaskMs,
    longTaskCount: longTasks.length,
  };
}

test('theme-switcher-snappiness', { tag: ['@performance'] }, async ({ page }) => {
  const promRegistry = new prom.Registry();

  const openDrawerMsGauge = new prom.Gauge({
    name: 'fe_theme_switcher_open_drawer_ms',
    help: 'Time to open the theme switcher drawer, in milliseconds',
    registers: [promRegistry],
  });
  const switchToDarkMsGauge = new prom.Gauge({
    name: 'fe_theme_switcher_switch_to_dark_ms',
    help: 'Time from selecting Dark to UI idle, in milliseconds',
    registers: [promRegistry],
  });
  const switchToLightMsGauge = new prom.Gauge({
    name: 'fe_theme_switcher_switch_to_light_ms',
    help: 'Time from selecting Light to UI idle, in milliseconds',
    registers: [promRegistry],
  });
  const switchMaxLongTaskMsGauge = new prom.Gauge({
    name: 'fe_theme_switcher_switch_max_longtask_ms',
    help: 'Max single long task duration observed during theme switches, in milliseconds',
    registers: [promRegistry],
  });
  const switchTotalLongTaskMsGauge = new prom.Gauge({
    name: 'fe_theme_switcher_switch_total_longtask_ms',
    help: 'Total long task duration observed during theme switches, in milliseconds',
    registers: [promRegistry],
  });
  const switchLongTaskCountGauge = new prom.Gauge({
    name: 'fe_theme_switcher_switch_longtask_count',
    help: 'Number of long tasks observed during theme switches',
    registers: [promRegistry],
  });

  await page.goto('/');
  // Wait for the top navigation to be ready.
  await expect(page.getByTestId('data-testid Nav toolbar')).toBeVisible();

  // Open the profile menu and click "Change theme" (requires grafanaconThemes to be enabled).
  const openDrawerRes = await measureThemeInteractionToIdle(page, async () => {
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.getByRole('menuitem', { name: 'Change theme' }).click();
  });

  await expect(page.getByRole('heading', { name: 'Change theme' })).toBeVisible();
  openDrawerMsGauge.set(openDrawerRes.durationMs);

  // Switch themes by interacting with the radio buttons.
  const toDark = await measureThemeInteractionToIdle(page, async () => {
    await page.getByRole('radio', { name: 'Dark' }).click();
  });
  const toLight = await measureThemeInteractionToIdle(page, async () => {
    await page.getByRole('radio', { name: 'Light' }).click();
  });

  switchToDarkMsGauge.set(toDark.durationMs);
  switchToLightMsGauge.set(toLight.durationMs);

  const maxLongTaskMs = Math.max(toDark.maxLongTaskMs, toLight.maxLongTaskMs);
  const totalLongTaskMs = toDark.totalLongTaskMs + toLight.totalLongTaskMs;
  const longTaskCount = toDark.longTaskCount + toLight.longTaskCount;

  switchMaxLongTaskMsGauge.set(maxLongTaskMs);
  switchTotalLongTaskMsGauge.set(totalLongTaskMs);
  switchLongTaskCountGauge.set(longTaskCount);

  const instance = new URL(process.env.GRAFANA_URL || 'http://undefined').host;
  promRegistry.setDefaultLabels({ instance });
  const metricsText = await promRegistry.metrics();

  console.log(metricsText);
  fs.writeFileSync(process.env.METRICS_OUTPUT_PATH || '/tmp/theme-switcher-perf.txt', metricsText);
});

