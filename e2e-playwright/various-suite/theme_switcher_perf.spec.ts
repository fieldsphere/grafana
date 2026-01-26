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
  const switchExperimentalMsGauge = new prom.Gauge({
    name: 'fe_theme_switcher_switch_experimental_ms',
    help: 'Time from selecting an experimental theme to UI idle, in milliseconds',
    registers: [promRegistry],
  });
  const switchExperimentalWarmMsGauge = new prom.Gauge({
    name: 'fe_theme_switcher_switch_experimental_warm_ms',
    help: 'Time switching back to an already-applied experimental theme, in milliseconds',
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

  const openThemeDrawer = async () => {
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.getByRole('menuitem', { name: 'Change theme' }).click();
    await expect(page.getByRole('heading', { name: 'Change theme' })).toBeVisible();
  };

  // Open the profile menu and click "Change theme" (requires grafanaconThemes to be enabled).
  const openDrawerRes = await measureThemeInteractionToIdle(page, async () => {
    await openThemeDrawer();
  });

  openDrawerMsGauge.set(openDrawerRes.durationMs);

  // Switch themes by interacting with the radio buttons.
  // The drawer closes on selection, so re-open it for each switch measurement.
  // Start with switching to Light to ensure the selection actually changes.
  await openThemeDrawer();
  const toLight = await measureThemeInteractionToIdle(page, async () => {
    await page.getByRole('radio', { name: 'Light' }).click();
  });

  switchToLightMsGauge.set(toLight.durationMs);

  await openThemeDrawer();
  const toDark = await measureThemeInteractionToIdle(page, async () => {
    await page.getByRole('radio', { name: 'Dark' }).click();
  });

  switchToDarkMsGauge.set(toDark.durationMs);

  // Switch between experimental themes while in Dark mode.
  await openThemeDrawer();
  const experimentalNameMatchers: Array<{ name: string; re: RegExp }> = [
    { name: 'Tron', re: /tron/i },
    { name: 'Gloom', re: /gloom/i },
    { name: 'Desert Bloom', re: /desert\s*bloom/i },
    { name: 'Gilded Grove', re: /gilded\s*grove/i },
    { name: 'Sapphire Dusk', re: /sapphire\s*dusk/i },
  ];

  const found: string[] = [];
  for (const matcher of experimentalNameMatchers) {
    const count = await page.getByRole('radio', { name: matcher.re }).count();
    if (count > 0) {
      found.push(matcher.name);
    }
    if (found.length >= 2) {
      break;
    }
  }

  if (found.length >= 2) {
    // First click sets a baseline theme without measuring (drawer closes on select).
    await page.getByRole('radio', { name: new RegExp(found[0], 'i') }).click();

    await openThemeDrawer();
    const experimentalSwitch = await measureThemeInteractionToIdle(page, async () => {
      await page.getByRole('radio', { name: new RegExp(found[1], 'i') }).click();
    });
    switchExperimentalMsGauge.set(experimentalSwitch.durationMs);

    // Switching back to a previously-applied theme should be fast if theme objects and style caches are reused.
    await openThemeDrawer();
    const experimentalWarmSwitch = await measureThemeInteractionToIdle(page, async () => {
      await page.getByRole('radio', { name: new RegExp(found[0], 'i') }).click();
    });
    switchExperimentalWarmMsGauge.set(experimentalWarmSwitch.durationMs);
  } else {
    // If experimental themes aren't available, record a sentinel value.
    switchExperimentalMsGauge.set(-1);
    switchExperimentalWarmMsGauge.set(-1);
  }

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

