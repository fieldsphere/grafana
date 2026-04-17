const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const htmlPath = path.resolve(__dirname, 'amethyst-theme-demo.html');
  const fileUrl = `file://${htmlPath}`;
  const screenshotPath = path.resolve(__dirname, 'amethyst-theme-screenshot.png');
  const videoPath = path.resolve(__dirname, 'amethyst-theme-walkthrough.webm');

  await page.goto(fileUrl);
  await page.waitForTimeout(300);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  // Record a short screencast by running ffmpeg against an image sequence.
  const framePrefix = path.resolve(__dirname, 'frames');
  for (const [index, themeId] of ['dark', 'light', 'amethyst'].entries()) {
    await page.click(`[data-theme-id="${themeId}"]`);
    await page.waitForTimeout(350);
    await page.screenshot({
      path: `${framePrefix}-${String(index).padStart(2, '0')}.png`,
      fullPage: true,
    });
  }

  await browser.close();

  const { spawnSync } = require('node:child_process');
  const ffmpegResult = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-framerate',
      '1',
      '-i',
      `${framePrefix}-%02d.png`,
      '-vf',
      'format=yuv420p',
      '-c:v',
      'libvpx-vp9',
      '-b:v',
      '1M',
      videoPath,
    ],
    { stdio: 'inherit' }
  );

  if (ffmpegResult.status !== 0) {
    process.exit(ffmpegResult.status ?? 1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
