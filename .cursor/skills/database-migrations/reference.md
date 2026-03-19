# Database Migrations Reference

## Location

`pkg/services/sqlstore/migrations/`

## File Naming

- Up: `YYYYMMDDHHMMSS_description.up.sql`
- Down: `YYYYMMDDHHMMSS_description.down.sql`
- Timestamp must be unique and ascending

## Up Migration Example

```sql
-- Add new table
CREATE TABLE IF NOT EXISTS my_table (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_my_table_name ON my_table(name);
```

## Down Migration Example

```sql
DROP INDEX IF EXISTS idx_my_table_name;
DROP TABLE IF EXISTS my_table;
```

## Best Practices

- Use `IF NOT EXISTS` / `IF EXISTS` for idempotency where appropriate
- Down must reverse up exactly
- Avoid data migrations in schema migrations; use separate migration steps
- Test with: `make devenv sources=postgres_tests,mysql_tests` then `make test-go-integration-postgres`
