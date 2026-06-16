# Amethyst theme artifacts

Source specification: `CUR-54` summary, "add a purple/amethyst theme to grafana theme switcher".

Implemented feature:

- Added a built-in `amethyst` Grafana theme.
- Exposed the Amethyst option in the theme switcher and shared preferences theme options.

Artifacts:

- Screenshot: `.cursor/docs/artifacts/amethyst-theme-switcher.png`
- Video walkthrough: `.cursor/docs/artifacts/amethyst-theme-walkthrough.webm`
- Capture demo: `.cursor/docs/artifacts/amethyst-theme-demo.html`
- Capture script: `.cursor/docs/artifacts/capture-amethyst-theme-artifacts.mjs`

Validation:

```bash
node .yarn/releases/yarn-4.11.0.cjs jest --no-watch packages/grafana-data/src/themes/createTheme.test.ts public/app/core/components/ThemeSelector/getSelectableThemes.test.ts
```
