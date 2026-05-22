import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const demoPath = path.join(artifactDir, 'amethyst-theme-demo.html');
const screenshotPath = path.join(artifactDir, 'amethyst-theme-switcher.png');
const videoPath = path.join(artifactDir, 'amethyst-theme-switcher-walkthrough.webm');
const frameDir = path.join(artifactDir, '.video-frames');

await fs.rm(screenshotPath, { force: true });
await fs.rm(videoPath, { force: true });
await fs.rm(frameDir, { force: true, recursive: true });
await fs.mkdir(frameDir, { recursive: true });

const browser = await chromium.launch({ executablePath: '/usr/local/bin/google-chrome' });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
});

const page = await context.newPage();
await page.goto(pathToFileURL(demoPath).href);
await page.screenshot({ path: screenshotPath, fullPage: true });

let frame = 1;
const captureFrames = async (count) => {
  for (let index = 0; index < count; index += 1) {
    await page.screenshot({ path: path.join(frameDir, `frame-${String(frame).padStart(3, '0')}.png`) });
    frame += 1;
  }
};

await page.getByRole('radio', { name: 'Dark' }).click();
await page.waitForTimeout(700);
await captureFrames(18);
await page.getByRole('button', { name: 'Select Amethyst' }).click();
await page.waitForTimeout(1000);
await captureFrames(30);
await page.getByRole('radio', { name: 'Amethyst Experimental' }).click();
await page.waitForTimeout(700);
await captureFrames(18);

await context.close();
await browser.close();

execFileSync('ffmpeg', [
  '-y',
  '-framerate',
  '15',
  '-i',
  path.join(frameDir, 'frame-%03d.png'),
  '-c:v',
  'libvpx-vp9',
  '-pix_fmt',
  'yuv420p',
  videoPath,
]);

await fs.rm(frameDir, { force: true, recursive: true });

console.log(`Wrote ${screenshotPath}`);
console.log(`Wrote ${videoPath}`);
