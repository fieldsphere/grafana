# CUR-54 implementation trace

## Ticket details

- **Issue key:** CUR-54
- **Summary (source of truth):** add a purple/amethyst theme to grafana theme switcher
- **Status in automation payload:** In Progress [Cursor]

## Implemented scope

- Added a new built-in extra theme definition: **Amethyst** (`id: amethyst`).
- Registered the theme in the Grafana theme registry.
- Exposed the theme in the Change theme drawer by including it with the `grafanaconThemes` set.
- Added a unit test for `getSelectableThemes` verifying Amethyst is present only when relevant feature toggle is enabled.

## Artifact files

- Screenshot: `.cursor/docs/artifacts/theme-switcher-amethyst.png`
- Video walkthrough: `.cursor/docs/artifacts/theme-switcher-amethyst-walkthrough.webm`

## Notes

- This environment has no Jira write integration configured, so no new Jira issue could be created programmatically from this run. The implementation is aligned to the CUR-54 summary field as requested.
