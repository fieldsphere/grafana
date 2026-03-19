# Code Review Standards

## Security

- **XSS**: Sanitize user input; use safe rendering (e.g. `dangerouslySetInnerHTML` only when necessary and sanitized)
- **SQL injection**: Use parameterized queries; never concatenate user input into SQL
- **Command injection**: Avoid `exec`/`execSync` with user input; use allowlists for shell commands

## Architecture

- Business logic in `pkg/services/<domain>/`, not in API handlers
- API handlers in `pkg/api/` delegate to services
- Frontend: Redux Toolkit slices, function components with hooks, RTK Query for data

## Patterns

- Backend: Wire DI; regenerate with `make gen-go` after service init changes
- Frontend: Emotion via `useStyles2`, React Testing Library for tests
- Separate PRs for frontend and backend when deployed at different cadences

## Testing

- New functionality must include tests
- Backend: `go test -run TestName ./pkg/services/myservice/`
- Frontend: `yarn jest path/to/file --no-watch`
