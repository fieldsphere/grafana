---
name: plugin-development
description: Build and develop Grafana plugins (datasources, panels, apps). Use when creating plugins, adding plugin components, or debugging plugin builds.
---

# Plugin Development

## Quick Start

1. **Create plugin**: Use `npx @grafana/create-plugin` or follow scaffold in [reference.md](reference.md)
2. **Build**: `yarn workspace @grafana-plugins/<name> dev` for dev mode
3. **Test**: Run plugin in Grafana; use `yarn start` for frontend, `make run` for backend

## Plugin Types

- **Datasource**: Query backends (Loki, Tempo, PostgreSQL, etc.)
- **Panel**: Visualization components
- **App**: Full-page plugins

## Key Paths

- Built-in plugins: `public/app/plugins/datasource/<name>/`, `public/app/plugins/panel/<name>/`
- Plugin SDK: `packages/grafana-data`, `@grafana/ui`, `@grafana/runtime`

## Additional Resources

- For scaffold structure, manifest format, and build commands, see [reference.md](reference.md)
