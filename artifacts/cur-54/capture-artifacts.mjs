import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.join(__dirname, 'theme-switcher-demo.html');
const screenshotPath = path.join(__dirname, 'theme-switcher-amethyst.png');

await mkdir(__dirname, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: {
    dir: __dirname,
    size: { width: 1280, height: 720 },
  },
});

const page = await context.newPage();
await page.goto(`file://${demoPath}`);
await page.waitForTimeout(500);
await page.click('#amethyst-card');
await page.waitForTimeout(1200);
await page.screenshot({ path: screenshotPath, fullPage: true });
await page.waitForTimeout(600);
await page.click('#dark-card');
await page.waitForTimeout(600);
await page.click('#amethyst-card');
await page.waitForTimeout(700);

const video = page.video();
await context.close();
const videoPath = await video.path();
await browser.close();

console.log(`Saved screenshot: ${screenshotPath}`);
console.log(`Saved video: ${videoPath}`);
