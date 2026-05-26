# CUR-54 Jira ticket

Summary source of truth: add a purple/amethyst theme to grafana theme switcher

Implementation notes:

- Adds a new built-in extra theme named `Amethyst`.
- Registers `amethyst` with the frontend theme registry.
- Makes `amethyst` selectable from the Grafana theme switcher by default.
- Regenerates the backend preference theme allowlist so `amethyst` is a valid saved preference.
