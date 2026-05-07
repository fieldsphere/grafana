const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('@playwright/test');

const artifactDir = __dirname;
const themePath = path.resolve(artifactDir, '../../packages/grafana-data/src/themes/themeDefinitions/amethyst.json');
const systemChromePath = '/usr/local/bin/google-chrome';
const theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
const colors = theme.colors;
const builtInThemes = ['System preference', 'Dark', 'Light'];
const extraThemes = ['Amethyst', 'Desert bloom', 'Gilded grove', 'Sapphire dusk', 'Tron', 'Gloom'];

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>CUR-54 Amethyst theme switcher artifact</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: Inter, Arial, sans-serif;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background: #111217;
        color: #ccccdc;
        transition: background 240ms ease, color 240ms ease;
      }

      body.amethyst {
        background: ${colors.background.canvas};
        color: ${colors.text.primary};
      }

      .page {
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 24px;
        padding: 32px;
      }

      .drawer,
      .panel {
        border: 1px solid rgba(204, 204, 220, 0.16);
        border-radius: 10px;
        background: #181b1f;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
        overflow: hidden;
      }

      body.amethyst .drawer,
      body.amethyst .panel {
        border-color: ${colors.border.medium};
        background: ${colors.background.primary};
      }

      .header {
        padding: 20px 24px;
        border-bottom: 1px solid rgba(204, 204, 220, 0.16);
      }

      body.amethyst .header {
        border-color: ${colors.border.weak};
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      h1 {
        font-size: 20px;
      }

      p {
        margin-top: 8px;
        color: rgba(204, 204, 220, 0.72);
      }

      body.amethyst p {
        color: ${colors.text.secondary};
      }

      .theme-grid {
        display: grid;
        gap: 12px;
        padding: 20px;
      }

      .theme-card {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 12px;
        min-height: 56px;
        border: 1px solid rgba(204, 204, 220, 0.12);
        border-radius: 8px;
        background: rgba(204, 204, 220, 0.04);
        color: inherit;
        cursor: pointer;
        font: inherit;
        padding: 0 14px;
        text-align: left;
      }

      .theme-card:hover,
      .theme-card.selected {
        border-color: ${colors.primary.main};
      }

      .dot {
        width: 16px;
        height: 16px;
        border: 2px solid currentColor;
        border-radius: 50%;
      }

      .selected .dot {
        box-shadow: inset 0 0 0 3px ${colors.background.primary};
        background: ${colors.primary.main};
      }

      .badge {
        border-radius: 999px;
        background: rgba(183, 148, 244, 0.18);
        color: ${colors.text.primary};
        font-size: 12px;
        padding: 3px 8px;
      }

      .preview {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        padding: 24px;
      }

      .metric {
        min-height: 150px;
        border: 1px solid ${colors.border.weak};
        border-radius: 10px;
        background: ${colors.background.secondary};
        padding: 18px;
      }

      .metric strong {
        color: ${colors.primary.text};
        display: block;
        font-size: 44px;
        margin-top: 24px;
      }

      .button {
        display: inline-block;
        margin-top: 24px;
        border-radius: 6px;
        background: ${colors.primary.main};
        color: #171124;
        font-weight: 700;
        padding: 10px 16px;
      }

      .gradient {
        height: 16px;
        margin-top: 24px;
        border-radius: 999px;
        background: ${colors.gradients.brandHorizontal};
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="drawer" aria-label="Change theme drawer">
        <div class="header">
          <h1>Change theme</h1>
          <p>Experimental themes include the new purple/amethyst option.</p>
        </div>
        <div class="theme-grid" role="radiogroup" aria-label="Interface theme">
          ${builtInThemes
            .map(
              (name) => `<button class="theme-card" role="radio" aria-checked="false">
                <span class="dot"></span><span>${name}</span><span></span>
              </button>`
            )
            .join('')}
          ${extraThemes
            .map(
              (name) => `<button class="theme-card${name === 'Amethyst' ? ' amethyst-option' : ''}" role="radio" aria-checked="false">
                <span class="dot"></span><span>${name}</span><span class="badge">Experimental</span>
              </button>`
            )
            .join('')}
        </div>
      </section>
      <section class="panel" aria-label="Amethyst theme preview">
        <div class="header">
          <h2>Amethyst theme preview</h2>
          <p>The selected theme applies deep violet surfaces with amethyst accents.</p>
        </div>
        <div class="preview">
          <div class="metric">
            Active users
            <strong>12.4k</strong>
            <div class="gradient"></div>
          </div>
          <div class="metric">
            Query success
            <strong>99.9%</strong>
            <span class="button">Primary action</span>
          </div>
        </div>
      </section>
    </main>
    <script>
      const cards = Array.from(document.querySelectorAll('.theme-card'));
      const amethyst = document.querySelector('.amethyst-option');
      const select = (card) => {
        cards.forEach((item) => {
          item.classList.remove('selected');
          item.setAttribute('aria-checked', 'false');
        });
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');
        document.body.classList.toggle('amethyst', card === amethyst);
      };
      cards.forEach((card) => card.addEventListener('click', () => select(card)));
    </script>
  </body>
</html>`;

async function run() {
  const htmlPath = path.join(artifactDir, 'amethyst-theme-switcher-demo.html');
  const screenshotPath = path.join(artifactDir, 'amethyst-theme-switcher.png');
  const videoPath = path.join(artifactDir, 'amethyst-theme-switcher-walkthrough.webm');
  const frameDir = path.join(artifactDir, 'frames');

  fs.writeFileSync(htmlPath, html);
  fs.rmSync(frameDir, { recursive: true, force: true });
  fs.mkdirSync(frameDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: fs.existsSync(systemChromePath) ? systemChromePath : undefined,
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: 'load' });

  let frame = 1;
  const captureFrame = async () => {
    await page.screenshot({ path: path.join(frameDir, `frame-${String(frame).padStart(3, '0')}.png`) });
    frame += 1;
  };

  for (let i = 0; i < 10; i++) {
    await captureFrame();
    await page.waitForTimeout(67);
  }

  await page.locator('.amethyst-option').click();
  for (let i = 0; i < 28; i++) {
    await captureFrame();
    await page.waitForTimeout(67);
  }
  await page.screenshot({ path: screenshotPath, fullPage: true });
  for (let i = 0; i < 20; i++) {
    await captureFrame();
    await page.waitForTimeout(67);
  }

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
    '-b:v',
    '1M',
    '-pix_fmt',
    'yuv420p',
    videoPath,
  ]);
  fs.rmSync(frameDir, { recursive: true, force: true });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
