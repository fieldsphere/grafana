# CUR-54: add a purple/amethyst theme to grafana theme switcher

Source of truth: Jira summary field, "add a purple/amethyst theme to grafana theme switcher".

## Implementation

- Added the `Amethyst` dark theme definition.
- Registered the theme with Grafana's theme registry.
- Included Amethyst in the selectable theme list by default.
- Shows the theme switcher when selectable extra themes are available.

## Validation

```bash
yarn jest --no-watch packages/grafana-data/src/themes/registry.test.ts public/app/core/components/ThemeSelector/getSelectableThemes.test.ts public/app/core/components/AppChrome/TopBar/ProfileButton.test.tsx
```

## Artifacts

- Screenshot: [CUR-54-amethyst-theme-switcher.png](./artifacts/CUR-54-amethyst-theme-switcher.png)
- Walkthrough video: [CUR-54-amethyst-theme-walkthrough.mp4](./artifacts/CUR-54-amethyst-theme-walkthrough.mp4)
