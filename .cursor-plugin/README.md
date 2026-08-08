# Grafana Dev Plugin

A Cursor plugin for Grafana development on the fieldsphere/grafana fork.

## Features

### Skills

- **initial-setup**: Run initial local development setup commands (frontend deps, backend build)
- **start-dev-server**: Start Grafana dev servers after initial setup
- **dev-server-hot-reload**: Start backend and frontend with hot reloading
- **github-fieldsphere-fork**: Ensure GitHub operations target fieldsphere/grafana

### Hooks

- **beforeShellExecution**: Enforces that mutating `gh` CLI commands target `fieldsphere/grafana` instead of upstream `grafana/grafana`

## Usage

### Initial Setup

Ask the agent to set up local development:

```
Set up the Grafana dev environment
```

### Start Dev Servers

After setup, start the development servers:

```
Start the dev server
```

### GitHub Operations

All GitHub-related tasks (PRs, issues, commits) automatically target `fieldsphere/grafana`.

## Requirements

- Node.js v24.x (see `.nvmrc`)
- Go 1.25.7 (see `go.mod`)
- Yarn 4.11.0 via corepack
- GCC for CGo/SQLite compilation

## Default Credentials

- URL: `http://localhost:3000`
- Username: `admin`
- Password: `admin`
