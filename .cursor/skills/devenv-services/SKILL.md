---
name: devenv-services
description: Start or stop backing services (Postgres, InfluxDB, Loki, etc.) for Grafana development. Use when the user needs databases, datasources, or integration test backends.
---

# Dev Environment Services

## Instructions

When the user needs backing services for development or integration tests, run from the repo root.

### Start services

```bash
# Common set
make devenv sources=postgres,influxdb,loki

# Postgres + MySQL for DB tests
make devenv sources=postgres_tests,mysql_tests
```

### Stop services

```bash
make devenv-down
```

## Notes

- Grafana uses embedded SQLite by default; no external DB is required for basic runs.
- Use `postgres_tests` and `mysql_tests` when running `make test-go-integration-postgres` or similar.
- Pre-commit hooks: `make lefthook-install`
