import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoPath = path.join(__dirname, 'amethyst-theme-demo.html');
const screenshotPath = path.join(__dirname, 'amethyst-theme-switcher.png');
const videoDir = path.join(__dirname, 'video');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();

await page.goto(`file://${demoPath}`);
await page.screenshot({ path: screenshotPath, fullPage: true });
await page.getByRole('radio', { name: 'Amethyst' }).click();
await page.waitForTimeout(1200);
await page.getByText('Panel').hover();
await page.waitForTimeout(1200);
await page.getByText('Save theme').click();
await page.waitForTimeout(1200);

const video = page.video();
await context.close();
await browser.close();

const videoPath = await video?.path();
if (videoPath) {
  console.log(`Screenshot: ${screenshotPath}`);
  console.log(`Video: ${videoPath}`);
}
