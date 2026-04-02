# Grafana Cursor toolkit

This plugin packages the Grafana-specific Cursor assets created in this repo into a standalone, publishable plugin folder.

## Included components

- Skills:
  - `check-container-memory`
  - `do-ticket`
  - `grafana-integration-testing`
  - `grafana-unit-testing`
  - `github-fieldsphere-fork`
- Agents:
  - `code-explorer`
  - `correlation-k8s-migrator`
  - `debugger`
  - `devils-advocate`
- Rules:
  - `test-directory-map`

## Why `github-fieldsphere-fork` is included

The `do-ticket` skill references the fork-targeting skill for GitHub operations. Including it keeps the plugin self-contained.

## Repository assumptions

These assets are tailored to the Grafana repository layout and workflows. Several skills and agents reference paths such as:

- `.cursor/docs/...`
- `.cursor/rules/test-directory-map.mdc`
- `pkg/...`
- `public/app/...`
- `apps/correlations/...`

Use this plugin in the Grafana repo, or adapt the referenced paths if you publish it for a different repository layout.

## Local validation

The plugin manifest lives at `.cursor-plugin/plugin.json` and uses the default Cursor folder structure:

- `skills/`
- `agents/`
- `rules/`

This makes the folder easy to extract into its own repository later if you want to publish it to the Cursor marketplace.
