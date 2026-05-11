# CUR-54 Jira source ticket

Summary source of truth: add a purple/amethyst theme to grafana theme switcher.

Implementation notes:

- Added an `amethyst` extra theme definition.
- Registered the theme with Grafana's built-in theme registry.
- Added `amethyst` to the existing GrafanaCon theme switcher list.
- Regenerated backend preference theme metadata so `amethyst` is accepted as a saved theme ID.

Artifacts:

- `artifacts/CUR-54/amethyst-theme-switcher.png`
- `artifacts/CUR-54/amethyst-theme-switcher-walkthrough.webm`
- `artifacts/CUR-54/amethyst-theme-switcher.html`
- `artifacts/CUR-54/capture-amethyst-theme.mjs`

Note: this automation environment did not expose Jira write credentials or a Jira MCP tool. The incoming Jira issue `CUR-54` was used as the source ticket, and this document records the ticket context included in the pull request.
