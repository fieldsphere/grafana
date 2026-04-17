# Amethyst Theme Artifacts

This document records the required cloud-agent artifacts for the feature:

- Summary source of truth: `add a purple/amethyst theme to grafana theme switcher`

## Files

- Screenshot: `.cursor/docs/artifacts/amethyst-theme-switcher.png`
- Walkthrough video: `.cursor/docs/artifacts/amethyst-theme-walkthrough.webm`

## How artifacts were generated

Artifacts were generated with:

```bash
node .cursor/docs/scripts/capture-amethyst-artifacts.mjs
```

The script reads:

- `packages/grafana-data/src/themes/themeDefinitions/amethyst.json`
- `public/app/core/components/ThemeSelector/getSelectableThemes.ts`

and renders a short visual walkthrough confirming:

1. `amethyst` appears in the theme selector list when `grafanaconThemes` is enabled.
2. The amethyst palette tokens are rendered.
3. The toggle flow demonstrates enabled/disabled visibility behavior.
