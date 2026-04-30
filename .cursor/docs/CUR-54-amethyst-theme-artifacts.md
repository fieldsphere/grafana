# CUR-54 Amethyst theme artifacts

Source of truth: Jira summary, "add a purple/amethyst theme to grafana theme switcher".

## Captured artifacts

- Screenshot: `.cursor/docs/artifacts/amethyst-theme-switcher.png`
- Video walkthrough: `.cursor/docs/artifacts/amethyst-theme-walkthrough.mp4`

## Implementation notes

- Added a new `amethyst` theme definition under `packages/grafana-data/src/themes/themeDefinitions/`.
- Registered the theme in the built-in theme registry.
- Added `amethyst` to the selectable theme list so it appears in the theme switcher.
