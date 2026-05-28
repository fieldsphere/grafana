import fs from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

const baseUrl = 'http://localhost:3000';
const outputDir = path.resolve('.cursor/docs/artifacts');
const videoDir = path.join(outputDir, 'video-tmp');
const screenshotPath = path.join(outputDir, 'amethyst-theme-switcher.png');
const finalVideoPath = path.join(outputDir, 'amethyst-theme-walkthrough.webm');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function maybeHandlePasswordReset(page) {
  const newPasswordInput = page.locator('input[name="newPassword"]');
  if (await newPasswordInput.isVisible({ timeout: 1500 }).catch(() => false)) {
    const password = 'adminadmin';
    await newPasswordInput.fill(password);
    await page.locator('input[name="confirmNewPassword"]').fill(password);
    await page.getByRole('button', { name: /submit|save/i }).click();
    await page.waitForLoadState('networkidle');
  }
}

async function login(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="user"]').fill('admin');
  await page.locator('input[name="password"]').fill('admin');
  await page.getByRole('button', { name: /log in|login/i }).click();
  await maybeHandlePasswordReset(page);
  await page.waitForLoadState('networkidle');
}

async function openThemePreferences(page) {
  await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  const themeSelector = page.locator('#shared-preferences-theme-select');
  await themeSelector.waitFor({ state: 'visible', timeout: 30000 });
  await themeSelector.click();
  await page.getByRole('option', { name: 'Amethyst' }).click({ timeout: 15000 });
  await page.waitForTimeout(1000);

  const saveButton = page.getByRole('button', { name: /save preferences/i });
  if (await saveButton.isVisible().catch(() => false)) {
    await saveButton.click();
    await page.waitForLoadState('networkidle');
  }
}

async function moveRecordedVideo() {
  const files = await fs.readdir(videoDir);
  if (!files.length) {
    throw new Error('No Playwright video file was generated.');
  }
  const sourcePath = path.join(videoDir, files[0]);
  await fs.rename(sourcePath, finalVideoPath);
}

async function main() {
  await ensureDir(outputDir);
  await ensureDir(videoDir);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1720, height: 980 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 },
    },
  });
  const page = await context.newPage();

  try {
    await login(page);
    await openThemePreferences(page);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await page.waitForTimeout(1500);
  } finally {
    await context.close();
    await browser.close();
  }

  await moveRecordedVideo();
  console.log(`Created screenshot: ${screenshotPath}`);
  console.log(`Created video: ${finalVideoPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
