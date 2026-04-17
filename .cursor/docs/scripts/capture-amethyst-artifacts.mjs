import fs from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

const workspaceRoot = '/workspace';
const artifactsDir = path.join(workspaceRoot, '.cursor/docs/artifacts');
const themeDefinitionPath = path.join(
  workspaceRoot,
  'packages/grafana-data/src/themes/themeDefinitions/amethyst.json'
);
const selectableThemesPath = path.join(
  workspaceRoot,
  'public/app/core/components/ThemeSelector/getSelectableThemes.ts'
);

function parseGrafanaconThemeIds(source) {
  const grafanaconBlockMatch = source.match(/if \(config\.featureToggles\.grafanaconThemes\) \{([\s\S]*?)\n  \}/);
  if (!grafanaconBlockMatch) {
    throw new Error('Could not find grafanaconThemes block in getSelectableThemes.ts');
  }

  const blockBody = grafanaconBlockMatch[1];
  const matches = [...blockBody.matchAll(/allowedExtraThemes\.push\('([^']+)'\);/g)];
  return matches.map((match) => match[1]);
}

function buildDemoHtml(themeJson, grafanaconThemes) {
  const colors = themeJson.colors;
  const palette = [
    ['Canvas', colors.background.canvas],
    ['Primary', colors.primary.main],
    ['Secondary', colors.secondary.main],
    ['Text', colors.text.primary],
    ['Accent', colors.action.selectedBorder],
  ];

  const paletteCards = palette
    .map(
      ([label, value]) => `
      <div class="swatch-card">
        <div class="swatch" style="background:${value}"></div>
        <div class="swatch-label">${label}</div>
        <code>${value}</code>
      </div>
    `
    )
    .join('');

  const listItems = grafanaconThemes
    .map((themeId) => {
      const activeClass = themeId === 'amethyst' ? 'theme-item theme-item--active' : 'theme-item';
      return `<li class="${activeClass}">${themeId}</li>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Amethyst theme artifact demo</title>
    <style>
      :root {
        color-scheme: dark;
      }
      body {
        margin: 0;
        font-family: Inter, Arial, sans-serif;
        background: ${colors.background.canvas};
        color: ${colors.text.primary};
      }
      .wrap {
        max-width: 1080px;
        margin: 0 auto;
        padding: 32px;
      }
      .title {
        margin: 0 0 8px;
        font-size: 32px;
      }
      .subtitle {
        margin: 0 0 24px;
        color: ${colors.text.secondary};
      }
      .card {
        background: ${colors.background.primary};
        border: 1px solid ${colors.border.strong};
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      }
      .pill {
        display: inline-block;
        padding: 6px 10px;
        border-radius: 999px;
        background: ${colors.primary.transparent};
        border: 1px solid ${colors.primary.border};
        color: ${colors.primary.text};
        font-weight: 600;
        margin-bottom: 16px;
      }
      .theme-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 10px;
        padding: 0;
        margin: 0;
        list-style: none;
      }
      .theme-item {
        background: ${colors.secondary.main};
        border: 1px solid ${colors.border.medium};
        border-radius: 10px;
        padding: 10px 12px;
      }
      .theme-item--active {
        border-color: ${colors.action.selectedBorder};
        box-shadow: 0 0 0 2px ${colors.primary.transparent};
      }
      .button-row {
        display: flex;
        gap: 12px;
      }
      button {
        background: ${colors.primary.main};
        border: 1px solid ${colors.primary.border};
        color: ${colors.primary.contrastText};
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
      }
      .swatch-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 12px;
      }
      .swatch-card {
        background: ${colors.background.secondary};
        border: 1px solid ${colors.border.medium};
        border-radius: 10px;
        padding: 10px;
      }
      .swatch {
        height: 52px;
        border-radius: 8px;
        border: 1px solid ${colors.border.strong};
      }
      .swatch-label {
        margin-top: 8px;
        font-weight: 600;
      }
      code {
        color: ${colors.text.secondary};
        font-size: 12px;
      }
      .muted {
        color: ${colors.text.secondary};
      }
      .hidden {
        display: none;
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1 class="title">Amethyst theme added to Theme Switcher</h1>
      <p class="subtitle">Source of truth: "add a purple/amethyst theme to grafana theme switcher"</p>

      <section class="card">
        <span class="pill">Theme selector entries when grafanaconThemes = true</span>
        <ul id="theme-list-enabled" class="theme-list">${listItems}</ul>
        <p id="theme-list-disabled" class="muted hidden">
          grafanaconThemes is disabled, so extra themes (including amethyst) are hidden.
        </p>
        <div class="button-row" style="margin-top: 16px;">
          <button id="disable">Disable grafanaconThemes</button>
          <button id="enable">Enable grafanaconThemes</button>
        </div>
      </section>

      <section class="card">
        <span class="pill">Amethyst palette preview</span>
        <div class="swatch-grid">${paletteCards}</div>
      </section>
    </main>
    <script>
      const enabledList = document.getElementById('theme-list-enabled');
      const disabledText = document.getElementById('theme-list-disabled');
      document.getElementById('disable').addEventListener('click', () => {
        enabledList.classList.add('hidden');
        disabledText.classList.remove('hidden');
      });
      document.getElementById('enable').addEventListener('click', () => {
        enabledList.classList.remove('hidden');
        disabledText.classList.add('hidden');
      });
    </script>
  </body>
</html>`;
}

async function main() {
  await fs.mkdir(artifactsDir, { recursive: true });

  const [themeDefinitionRaw, selectableThemesRaw] = await Promise.all([
    fs.readFile(themeDefinitionPath, 'utf8'),
    fs.readFile(selectableThemesPath, 'utf8'),
  ]);

  const amethystTheme = JSON.parse(themeDefinitionRaw);
  const grafanaconThemes = parseGrafanaconThemeIds(selectableThemesRaw);

  if (!grafanaconThemes.includes('amethyst')) {
    throw new Error('Expected amethyst in grafanacon theme list');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: artifactsDir,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();
  const video = page.video();

  await page.setContent(buildDemoHtml(amethystTheme, grafanaconThemes), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  await page.screenshot({
    path: path.join(artifactsDir, 'amethyst-theme-switcher.png'),
    fullPage: true,
  });

  await page.click('#disable');
  await page.waitForTimeout(1400);
  await page.click('#enable');
  await page.waitForTimeout(1600);

  await context.close();
  const recordedVideoPath = await video.path();
  await browser.close();

  await fs.copyFile(recordedVideoPath, path.join(artifactsDir, 'amethyst-theme-walkthrough.webm'));
}

await main();
