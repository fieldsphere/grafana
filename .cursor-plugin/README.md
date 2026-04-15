# Grafana Dev Tools Plugin

Development tools and workflows for the Grafana monorepo, including local dev setup, hot reloading, and GitHub fork management for fieldsphere/grafana.

## Skills

| Skill | Description |
|-------|-------------|
| `initial-setup` | Run initial local development setup commands (frontend deps, backend build) |
| `start-dev-server` | Start Grafana backend and frontend dev servers after setup |
| `dev-server-hot-reload` | Start development servers with hot reloading enabled |
| `github-fieldsphere-fork` | Ensure all GitHub operations target fieldsphere/grafana fork |

## Hooks

| Event | Description |
|-------|-------------|
| `beforeShellExecution` | Enforces fieldsphere/grafana for mutating `gh` CLI commands |

## Usage

Skills are automatically available to Cursor agents. They will be triggered based on user requests matching the skill descriptions.

The `beforeShellExecution` hook runs automatically before any shell command containing `gh`, blocking write operations against `grafana/grafana` and requiring explicit `--repo fieldsphere/grafana` for mutating commands.

## Structure

```
.cursor/
  skills/
    initial-setup/SKILL.md
    start-dev-server/SKILL.md
    dev-server-hot-reload/SKILL.md
    github-fieldsphere-fork/SKILL.md
  hooks/
    enforce-fieldsphere-gh.sh
  hooks.json
.cursor-plugin/
  plugin.json
  README.md
```
