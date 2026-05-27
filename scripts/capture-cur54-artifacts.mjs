import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(workspaceRoot, 'artifacts', 'CUR-54', 'theme-switcher-demo.html');
const screenshotPath = path.join(workspaceRoot, 'artifacts', 'CUR-54', 'cur-54-amethyst-theme.png');
const videoPath = path.join(workspaceRoot, 'artifacts', 'CUR-54', 'cur-54-amethyst-theme-walkthrough.webm');

const fileUrl = `file://${htmlPath}`;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  recordVideo: {
    dir: path.join(workspaceRoot, 'artifacts', 'CUR-54'),
    size: { width: 1400, height: 900 },
  },
});

const page = await context.newPage();
await page.goto(fileUrl, { waitUntil: 'load' });
await page.waitForTimeout(400);

await page.click('[data-theme="amethyst"]');
await page.waitForTimeout(500);
await page.screenshot({ path: screenshotPath, fullPage: true });

await page.click('[data-theme="dark"]');
await page.waitForTimeout(500);
await page.click('[data-theme="amethyst"]');
await page.waitForTimeout(500);
await page.hover('[data-theme="amethyst"]');
await page.waitForTimeout(600);
await page.hover('#primary-action');
await page.waitForTimeout(600);
await page.hover('#secondary-action');
await page.waitForTimeout(500);

await context.close();
await browser.close();

// move generated video to deterministic filename
const artifactDir = path.join(workspaceRoot, 'artifacts', 'CUR-54');
const candidates = (await fs.readdir(artifactDir))
  .filter((name) => name.endsWith('.webm') && name !== path.basename(videoPath))
  .map((name) => path.join(artifactDir, name))
  .sort((a, b) => fsSync.statSync(b).mtimeMs - fsSync.statSync(a).mtimeMs);

if (candidates.length > 0) {
  await fs.rename(candidates[0], videoPath);
}
