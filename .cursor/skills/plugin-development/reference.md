# Plugin Development Reference

## Plugin Workspaces (Built-in)

These require separate build steps:
- `azuremonitor`, `cloud-monitoring`, `grafana-postgresql-datasource`
- `loki`, `tempo`, `jaeger`, `zipkin`, `parca`, `grafana-pyroscope-datasource`
- `mysql`, `grafana-testdata-datasource`

## Build Command

```bash
yarn workspace @grafana-plugins/<name> dev
```

## Manifest (plugin.json)

- `id`: unique plugin ID
- `type`: `datasource` | `panel` | `app`
- `name`, `info`, `dependencies`

## Directory Structure (typical)

```
plugin-name/
├── src/
│   ├── module.ts          # Entry
│   ├── plugin.json
│   └── components/
├── package.json
└── README.md
```

## Shared Packages

- `@grafana/data` — data structures, frames
- `@grafana/ui` — UI components
- `@grafana/runtime` — config, backendSrv
- `@grafana/schema` — CUE-generated types

## Creating New Plugin

```bash
npx @grafana/create-plugin
```

Follow prompts for datasource, panel, or app.
