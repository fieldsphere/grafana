import { execFile } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { chromium } from 'playwright';

const run = promisify(execFile);
const artifactDir = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(artifactDir, 'theme-switcher-amethyst-demo.html');
const screenshotPath = join(artifactDir, 'theme-switcher-amethyst.png');
const videoPath = join(artifactDir, 'theme-switcher-amethyst-walkthrough.webm');
const framesDir = join(artifactDir, 'frames');
const chromePath = process.env.CHROME_BIN || '/usr/local/bin/google-chrome';

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--no-sandbox'],
});

const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(htmlPath).href);
await page.screenshot({ path: screenshotPath, fullPage: true });

await rm(framesDir, { recursive: true, force: true });
await mkdir(framesDir, { recursive: true });

let frame = 0;
async function captureFrames(theme, count) {
  await page.locator(`[data-theme="${theme}"]`).click();
  await page.waitForTimeout(150);

  for (let index = 0; index < count; index++) {
    await page.screenshot({ path: join(framesDir, `frame-${String(frame).padStart(3, '0')}.png`) });
    frame++;
  }
}

await captureFrames('dark', 12);
await captureFrames('light', 12);
await captureFrames('amethyst', 24);
await page.close();
await browser.close();

await run('ffmpeg', [
  '-y',
  '-framerate',
  '12',
  '-i',
  join(framesDir, 'frame-%03d.png'),
  '-c:v',
  'libvpx-vp9',
  '-pix_fmt',
  'yuv420p',
  videoPath,
]);
await rm(framesDir, { recursive: true, force: true });

console.log(`Wrote ${resolve(screenshotPath)}`);
console.log(`Wrote ${resolve(videoPath)}`);
