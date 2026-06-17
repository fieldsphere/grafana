const path = require('path');
const { execFile } = require('child_process');
const fs = require('fs/promises');
const { promisify } = require('util');
const { chromium } = require('playwright');

const execFileAsync = promisify(execFile);

async function main() {
  const artifactDir = __dirname;
  const htmlPath = path.join(artifactDir, 'feature-flags-dashboard-demo.html');
  const screenshotPath = path.join(artifactDir, 'feature-flags-dashboard.png');
  const framesDir = path.join(artifactDir, 'frames');
  const videoPath = path.join(artifactDir, 'feature-flags-dashboard-walkthrough.webm');

  const browser = await chromium.launch({ executablePath: '/usr/local/bin/google-chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.goto(`file://${htmlPath}`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await fs.rm(framesDir, { recursive: true, force: true });
  await fs.mkdir(framesDir, { recursive: true });

  const steps = [
    { left: 12, top: 246, width: 216, height: 45, label: 'New Labs section with label' },
    { left: 270, top: 30, width: 1030, height: 175, label: 'Feature flags dashboard' },
    { left: 270, top: 252, width: 760, height: 128, label: 'Search, counts, and reload/reset actions' },
    { left: 1250, top: 500, width: 130, height: 210, label: 'Toggle local overrides' },
    { left: 280, top: 492, width: 820, height: 60, label: 'Overrides are clearly marked' },
  ];

  let frame = 0;
  for (const step of steps) {
    await page.evaluate((currentStep) => {
      const previous = document.getElementById('capture-callout');
      previous?.remove();

      const callout = document.createElement('div');
      callout.id = 'capture-callout';
      callout.textContent = currentStep.label;
      callout.style.position = 'fixed';
      callout.style.left = `${currentStep.left}px`;
      callout.style.top = `${currentStep.top}px`;
      callout.style.width = `${currentStep.width}px`;
      callout.style.height = `${currentStep.height}px`;
      callout.style.border = '3px solid #ff9830';
      callout.style.borderRadius = '10px';
      callout.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.28)';
      callout.style.color = '#ffffff';
      callout.style.font = '700 16px Inter, sans-serif';
      callout.style.padding = '8px';
      callout.style.pointerEvents = 'none';
      callout.style.zIndex = '10';
      document.body.appendChild(callout);
    }, step);

    for (let i = 0; i < 15; i += 1) {
      frame += 1;
      await page.screenshot({ path: path.join(framesDir, `frame-${String(frame).padStart(3, '0')}.png`) });
    }
  }

  await context.close();
  await browser.close();

  await execFileAsync('/usr/bin/ffmpeg', [
    '-y',
    '-framerate',
    '10',
    '-i',
    path.join(framesDir, 'frame-%03d.png'),
    '-c:v',
    'libvpx-vp9',
    '-b:v',
    '1M',
    '-pix_fmt',
    'yuv420p',
    videoPath,
  ]);
  await fs.rm(framesDir, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
