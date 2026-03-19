---
name: database-migrations
description: Create and run SQL migrations for Grafana. Use when adding database tables, columns, or schema changes.
---

# Database Migrations

## Quick Start

1. Create a new migration file in `pkg/services/sqlstore/migrations/`
2. Follow naming: `YYYYMMDDHHMMSS_description.up.sql` and `.down.sql`
3. Test with `make devenv sources=postgres_tests,mysql_tests` then `make test-go-integration-postgres`

## Migration Structure

See [reference.md](reference.md) for:
- File naming and location
- Up/down SQL patterns
- Idempotency and rollback

## Notes

- Migrations run automatically on Grafana startup
- Use both Postgres and MySQL test sources when schema may differ
- Never modify existing migrations that have been deployed

## Additional Resources

- For migration file format and examples, see [reference.md](reference.md)
