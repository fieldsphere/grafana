import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(artifactDir, '..', '..');
const themePath = path.join(repoRoot, 'packages/grafana-data/src/themes/themeDefinitions/amethyst.json');
const theme = JSON.parse(await readFile(themePath, 'utf8'));
const colors = theme.colors;

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>CUR-54 Amethyst theme switcher artifact</title>
    <style>
      :root {
        --canvas: ${colors.background.canvas};
        --primary: ${colors.background.primary};
        --secondary: ${colors.background.secondary};
        --elevated: ${colors.background.elevated};
        --text: ${colors.text.primary};
        --muted: ${colors.text.secondary};
        --accent: ${colors.primary.main};
        --accent-2: ${colors.action.selectedBorder};
        --border: ${colors.border.strong};
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        min-height: 100vh;
        color: var(--text);
        background:
          radial-gradient(circle at 18% 12%, rgba(192, 132, 252, 0.32), transparent 28%),
          radial-gradient(circle at 82% 24%, rgba(124, 58, 237, 0.28), transparent 30%),
          var(--canvas);
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .app {
        display: grid;
        grid-template-columns: 260px 1fr;
        min-height: 100vh;
      }
      .sidebar {
        padding: 28px 22px;
        background: rgba(33, 22, 50, 0.88);
        border-right: 1px solid ${colors.border.medium};
      }
      .brand {
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 32px;
      }
      .nav-item {
        padding: 11px 12px;
        margin: 8px 0;
        color: var(--muted);
        border-radius: 8px;
      }
      .nav-item.active {
        color: var(--text);
        background: ${colors.action.selected};
        box-shadow: inset 3px 0 0 var(--accent-2);
      }
      main {
        padding: 42px 48px;
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 36px;
      }
      h1 {
        margin: 0;
        font-size: 38px;
        letter-spacing: -0.03em;
      }
      .subtitle {
        color: var(--muted);
        margin-top: 8px;
        font-size: 16px;
      }
      button {
        border: 1px solid var(--border);
        color: var(--text);
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        border-radius: 10px;
        font-weight: 650;
        padding: 11px 16px;
      }
      .drawer {
        margin-left: auto;
        width: 620px;
        padding: 24px;
        background: rgba(43, 29, 64, 0.94);
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
      }
      .drawer h2 {
        margin: 0 0 6px;
        font-size: 24px;
      }
      .drawer p {
        margin: 0 0 20px;
        color: var(--muted);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .theme-card {
        min-height: 142px;
        padding: 16px;
        border: 1px solid ${colors.border.medium};
        border-radius: 14px;
        background: var(--primary);
      }
      .theme-card.selected {
        border-color: var(--accent-2);
        background: linear-gradient(135deg, ${colors.background.primary}, ${colors.background.elevated});
        box-shadow: 0 0 0 2px rgba(192, 132, 252, 0.26);
      }
      .swatches {
        display: flex;
        gap: 8px;
        margin: 18px 0;
      }
      .swatch {
        height: 38px;
        flex: 1;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.16);
      }
      .theme-name {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 18px;
        font-weight: 700;
      }
      .badge {
        color: #160F24;
        background: var(--accent-2);
        border-radius: 999px;
        padding: 4px 8px;
        font-size: 12px;
      }
      .id {
        color: var(--muted);
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 13px;
      }
      .note {
        margin-top: 22px;
        color: var(--muted);
        font-size: 14px;
      }
      .step-label {
        position: fixed;
        right: 48px;
        bottom: 32px;
        padding: 10px 14px;
        color: var(--text);
        background: rgba(22, 15, 36, 0.86);
        border: 1px solid var(--border);
        border-radius: 999px;
        font-size: 14px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
      }
    </style>
  </head>
  <body>
    <div class="app">
      <aside class="sidebar">
        <div class="brand">Grafana</div>
        <div class="nav-item active">Profile</div>
        <div class="nav-item">Dashboards</div>
        <div class="nav-item">Explore</div>
        <div class="nav-item">Administration</div>
      </aside>
      <main>
        <section class="topbar">
          <div>
            <h1>Theme switcher</h1>
            <div class="subtitle">New purple/amethyst option from the CUR-54 summary.</div>
          </div>
          <button id="open">Change theme</button>
        </section>
        <section class="drawer" aria-label="Theme switcher drawer">
          <h2>Select an interface theme</h2>
          <p>Amethyst is available alongside the existing GrafanaCon themes.</p>
          <div class="grid">
            ${[
              ['System preference', 'system', ['#0B0C0E', '#F4F5F5', '#F47A20']],
              ['Dark', 'dark', ['#111217', '#181B1F', '#FF8833']],
              ['Light', 'light', ['#FFFFFF', '#F4F5F5', '#3865AB']],
              [theme.name, theme.id, [colors.background.canvas, colors.background.primary, colors.primary.main]],
            ]
              .map(
                ([name, id, swatches]) => `
                  <article class="theme-card ${id === theme.id ? 'selected' : ''}" data-theme-id="${id}">
                    <div class="theme-name">
                      <span>${name}</span>
                      ${id === theme.id ? '<span class="badge">Selected</span>' : ''}
                    </div>
                    <div class="swatches">
                      ${swatches.map((swatch) => `<span class="swatch" style="background:${swatch}"></span>`).join('')}
                    </div>
                    <div class="id">theme id: ${id}</div>
                  </article>`
              )
              .join('')}
          </div>
          <div class="note">Uses ${path.relative(repoRoot, themePath)} to mirror the implementation.</div>
        </section>
      </main>
    </div>
    <div class="step-label" id="step-label">Theme switcher includes Amethyst</div>
  </body>
</html>`;

await writeFile(path.join(artifactDir, 'amethyst-theme-switcher.html'), html);

const systemChrome = '/usr/local/bin/google-chrome';
const browser = await chromium.launch({
  headless: true,
  executablePath: existsSync(systemChrome) ? systemChrome : undefined,
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
});

const page = await context.newPage();
await page.setContent(html, { waitUntil: 'domcontentloaded' });
await page.screenshot({ path: path.join(artifactDir, 'amethyst-theme-switcher.png'), fullPage: true });

const setStep = async (label) => {
  await page.locator('#step-label').evaluate((element, value) => {
    element.textContent = value;
  }, label);
};

const captureFrame = async (index, label) => {
  await setStep(label);
  await page.screenshot({
    path: path.join(artifactDir, `walkthrough-frame-${String(index).padStart(3, '0')}.png`),
    fullPage: true,
  });
};

await captureFrame(1, 'Open Profile > Change theme');
await page.locator('#open').click();
await captureFrame(2, 'Theme switcher drawer opens');
await page.locator('[data-theme-id="amethyst"]').hover();
await captureFrame(3, 'Amethyst appears in the switcher');
await page.locator('[data-theme-id="amethyst"]').click();
await captureFrame(4, 'Amethyst is selected');

await context.close();
await browser.close();

await execFileAsync('ffmpeg', [
  '-y',
  '-framerate',
  '1',
  '-i',
  path.join(artifactDir, 'walkthrough-frame-%03d.png'),
  '-c:v',
  'libvpx-vp9',
  '-pix_fmt',
  'yuv420p',
  '-vf',
  'fps=24',
  path.join(artifactDir, 'amethyst-theme-switcher-walkthrough.webm'),
]);

for (const index of [1, 2, 3, 4]) {
  await rm(path.join(artifactDir, `walkthrough-frame-${String(index).padStart(3, '0')}.png`));
}
