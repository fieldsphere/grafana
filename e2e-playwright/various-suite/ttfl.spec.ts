import { test, expect } from '@grafana/plugin-e2e';

const SAMPLE_COUNT = 8;
const FIRST_GATE_MS = 2000;

test('login first-contentful-paint mean', { tag: '@performance' }, async ({ page, selectors }) => {
  const samples: number[] = [];

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    await page.goto(selectors.pages.Login.url, { waitUntil: 'commit' });
    await page.waitForFunction(() => performance.getEntriesByName('first-contentful-paint').length > 0);

    const fcp = await page.evaluate(() => {
      const entry = performance.getEntriesByName('first-contentful-paint')[0];
      return entry.startTime;
    });

    samples.push(fcp);
  }

  const meanMs = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  console.log(JSON.stringify({ metric: 'login_fcp_ms', samples, meanMs, targetMs: 600 }));

  expect(samples).toHaveLength(SAMPLE_COUNT);
  expect(Math.min(...samples)).toBeGreaterThan(0);
  expect(meanMs).toBeLessThan(FIRST_GATE_MS);
});
