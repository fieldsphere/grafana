---
name: lint-fix
description: Run lint and format commands for Go and TypeScript in the Grafana repo. Use when the user asks to lint, fix lint errors, format code, or run prettier.
---

# Lint and Format

## Instructions

When the user wants to lint or format code, run the appropriate commands from the repo root.

### Go

```bash
make lint-go
```

### Frontend (ESLint + Prettier)

```bash
# Lint
yarn lint

# Auto-fix lint issues
yarn lint:fix

# Format with Prettier
yarn prettier:write

# TypeScript check
yarn typecheck
```

## Notes

- Run `yarn lint:fix` before `yarn prettier:write` for best results.
- Use `yarn typecheck` to catch TypeScript errors without running full build.
