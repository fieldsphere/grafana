---
name: commit-message-format
description: Generate conventional commit messages for Grafana changes. Use when the user asks for a commit message, git commit, or how to format commits.
---

# Commit Message Format

## Instructions

Use conventional commits. Format: `type(scope): subject` with optional body.

### Types

| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Build, tooling, dependencies |

### Examples

```
feat(alerting): add silence duration validation
fix(dashboards): correct panel height calculation
docs(readme): update setup instructions
refactor(api): extract auth middleware
```

### Body (optional)

Add a blank line after the subject, then a body explaining the change and why.
