import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const BASE_URL = process.env.GRAFANA_URL || 'http://localhost:3000';
const ARTIFACTS_DIR = '/opt/cursor/artifacts';
const VIDEO_DIR = path.join(ARTIFACTS_DIR, 'navbar-video-tmp');

fs.mkdirSync(VIDEO_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();

const pause = (ms) => page.waitForTimeout(ms);

async function login() {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input[name="user"]', { timeout: 30000 });
  await page.locator('input[name="user"]').fill('admin');
  await page.locator('input[type="password"]').fill('admin');
  await page.getByRole('button', { name: /^log in$/i }).click();
  const skip = page.getByRole('button', { name: /^skip$/i });
  await skip.waitFor({ state: 'visible', timeout: 15000 });
  await skip.click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 60000 });
  await page.locator('#mega-menu-toggle, [data-testid="data-testid navigation mega-menu"]').first().waitFor({
    timeout: 60000,
  });
}

async function dismissBlockingOverlays() {
  const escapeTargets = [
    page.getByRole('button', { name: /^close$/i }),
    page.getByRole('button', { name: /^dismiss$/i }),
    page.getByRole('button', { name: /^got it$/i }),
    page.getByRole('button', { name: /^maybe later$/i }),
  ];
  for (const target of escapeTargets) {
    if (await target.isVisible({ timeout: 500 }).catch(() => false)) {
      await target.click().catch(() => {});
      await pause(300);
    }
  }
  await page.keyboard.press('Escape').catch(() => {});
}

async function ensureMegaMenuOpen() {
  await dismissBlockingOverlays();
  const menu = page.getByTestId('data-testid navigation mega-menu');
  if (await menu.isVisible().catch(() => false)) {
    return menu;
  }
  const toggle = page.locator('#mega-menu-toggle');
  if (await toggle.isVisible().catch(() => false)) {
    await toggle.click({ force: true });
    await menu.waitFor({ state: 'visible', timeout: 10000 });
  }
  return menu;
}

async function clickTopLevelNavItem(label) {
  const menu = await ensureMegaMenuOpen();
  const item = menu
    .getByTestId('data-testid Nav menu item')
    .filter({ hasText: new RegExp(`^${label}$`, 'i') })
    .first();
  if (!(await item.isVisible({ timeout: 3000 }).catch(() => false))) {
    console.log(`SKIP (not found): ${label}`);
    return false;
  }
  const href = await item.getAttribute('href');
  if (href) {
    await page.goto(new URL(href, BASE_URL).toString(), { waitUntil: 'networkidle' });
  } else {
    await item.click({ force: true });
  }
  await pause(2000);
  await dismissBlockingOverlays();
  console.log(`OK: ${label} -> ${page.url()}`);
  return true;
}

try {
  await login();
  await pause(1500);

  const navLabels = [
    'Dashboards',
    'Explore',
    'Alerting',
    'Connections',
    'Administration',
    'Home',
  ];

  for (const label of navLabels) {
    await clickTopLevelNavItem(label);
  }

  await pause(1000);
} catch (err) {
  console.error('Walkthrough failed:', err);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'navbar-error.png'), fullPage: true });
  throw err;
} finally {
  await context.close();
  await browser.close();
}

const webmFiles = fs.readdirSync(VIDEO_DIR).filter((f) => f.endsWith('.webm'));
if (!webmFiles.length) {
  throw new Error('No video file recorded');
}
const rawVideo = path.join(VIDEO_DIR, webmFiles[0]);
const outputMp4 = path.join(ARTIFACTS_DIR, 'grafana-navbar-walkthrough.mp4');

const ffmpeg = spawnSync(
  'ffmpeg',
  ['-y', '-i', rawVideo, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outputMp4],
  { encoding: 'utf-8' }
);
if (ffmpeg.status !== 0) {
  fs.copyFileSync(rawVideo, path.join(ARTIFACTS_DIR, 'grafana-navbar-walkthrough.webm'));
  console.log('ffmpeg failed, kept webm:', ffmpeg.stderr);
} else {
  console.log('VIDEO:', outputMp4);
}
