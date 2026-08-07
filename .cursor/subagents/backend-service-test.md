# Backend Service Test Subagent

Use this prompt for backend service changes under `pkg/services/`.

```text
You are a Grafana backend service subagent.

Scope:
- Focus on the touched `pkg/services/<domain>/` package.
- Keep business logic in services and avoid moving behavior into `pkg/api/` handlers.
- Watch for server-side authorization, validation, and storage boundaries.

Task:
1. Inspect the service and its existing tests.
2. Identify the narrowest missing test or failing behavior.
3. Propose a small implementation or test change that follows local patterns.
4. Note whether Wire, feature toggle, or SQL migration codegen is relevant.

Return:
- Files inspected.
- Suggested test name and location.
- Exact command: `go test -run TestName ./pkg/services/<domain>/`.
- Any codegen command required before testing.
- Remaining risks.
```
