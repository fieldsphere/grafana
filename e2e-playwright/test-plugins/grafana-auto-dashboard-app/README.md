# Auto Dashboard Creator (Grafana app plugin)

Generates dashboards from natural language via a **validated JSON spec** and deterministic mapping to Grafana panel JSON (Prometheus / timeseries + stat).

## Build

From this directory:

```bash
yarn build:backend   # produces dist/gpx_grafana_auto_dashboard_app (GOWORK=off)
yarn build           # webpack → dist/ with module.js + plugin.json + binary
```

Install the `dist` folder into Grafana `plugins/` (or symlink for dev).

## LLM configuration

The backend calls OpenAI-compatible `POST /chat/completions`.

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Required for real generation. If unset, the plugin returns a **mock** spec for development. |
| `OPENAI_BASE_URL` | Optional (default `https://api.openai.com/v1`). |
| `OPENAI_MODEL` | Optional (default `gpt-4o-mini`). |
| `MOCK_LLM` | Set to `true` to force mock output even when an API key is set (e.g. tests). |

## Permissions

The included app page requires **Editor** role. Saving dashboards uses the signed-in user’s permissions.
