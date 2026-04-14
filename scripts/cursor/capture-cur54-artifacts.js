const path = require('path');
const fs = require('fs/promises');
const { chromium } = require('playwright');

async function main() {
  const htmlPath = path.resolve(__dirname, '../../artifacts/CUR-54/amethyst-theme-demo.html');
  const screenshotPath = path.resolve(__dirname, '../../artifacts/CUR-54/amethyst-theme-screenshot.png');
  const videoDir = path.resolve(__dirname, '../../artifacts/CUR-54');
  const videoPathFinal = path.resolve(__dirname, '../../artifacts/CUR-54/amethyst-theme-walkthrough.webm');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1400, height: 900 },
    },
  });
  const page = await context.newPage();

  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(300);

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  await page.selectOption('#themeSelect', 'amethyst');
  await page.waitForTimeout(600);
  await page.selectOption('#themeSelect', 'dark');
  await page.waitForTimeout(700);
  await page.selectOption('#themeSelect', 'sapphiredusk');
  await page.waitForTimeout(700);
  await page.selectOption('#themeSelect', 'amethyst');
  await page.waitForTimeout(1200);

  const video = page.video();
  await context.close();
  await browser.close();

  const videoPath = await video.path();
  await fs.rm(videoPathFinal, { force: true });
  await fs.rename(videoPath, videoPathFinal);
  console.log(`Screenshot: ${screenshotPath}`);
  console.log(`Video: ${videoPathFinal}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
