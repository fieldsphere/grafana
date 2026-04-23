const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:3000';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    recordVideo: {
      dir: path.join(process.cwd(), 'artifacts', 'CUR-55'),
      size: { width: 1600, height: 900 },
    },
  });

  const page = await context.newPage();

  const loginResponse = await context.request.post(`${BASE_URL}/login`, {
    headers: { 'Content-Type': 'application/json' },
    data: { user: 'admin', password: 'admin' },
  });

  if (!loginResponse.ok()) {
    throw new Error(`Login failed with status ${loginResponse.status()}`);
  }

  await page.goto(`${BASE_URL}/admin/labs/feature-flags`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Feature flagging dashboard', { timeout: 60000 });

  await page.fill('[data-testid="feature-flag-dashboard-search"]', 'dashboard');
  await page.waitForTimeout(1000);
  await page.fill('[data-testid="feature-flag-dashboard-search"]', '');
  await page.waitForTimeout(1000);

  const firstSwitch = page.getByRole('switch').first();
  if (await firstSwitch.count()) {
    await firstSwitch.check({ force: true });
    await page.waitForTimeout(1000);
  }

  await page.click('[data-testid="feature-flag-dashboard-reset"]');
  await page.waitForTimeout(1000);

  const screenshotPath = path.join(process.cwd(), 'artifacts', 'CUR-55', 'feature-flag-dashboard.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await page.waitForTimeout(1500);
  const videoPath = await page.video().path();
  await context.close();
  await browser.close();

  console.log(`screenshot=${screenshotPath}`);
  console.log(`video=${videoPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
