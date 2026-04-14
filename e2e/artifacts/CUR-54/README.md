# CUR-54 artifact bundle

This directory contains cloud agent artifacts for Jira ticket `CUR-54` ("add a purple/amethyst theme to grafana theme switcher").

## Included artifacts

- `amethyst-theme-switcher-screenshot.png` - screenshot showing the Amethyst theme selected in the theme switcher mock.
- `amethyst-theme-walkthrough.mp4` - short walkthrough video toggling themes and ending on Amethyst.
- `amethyst-theme-demo.html` - static demo page used to capture the screenshot and video.

## Notes

- Source-of-truth implementation is in Grafana code under:
  - `packages/grafana-data/src/themes/themeDefinitions/amethyst.json`
  - `packages/grafana-data/src/themes/registry.ts`
  - `public/app/core/components/ThemeSelector/getSelectableThemes.ts`
