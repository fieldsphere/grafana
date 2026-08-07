# Cursor Subagent Demo Playbooks

These files are ready-to-copy prompts for Cursor subagents during a Grafana 101 demo. They are not runtime registrations; use them as launch templates when you want parallel agents to explore, test, or review a focused area.

## Suggested demo flow

1. Parent agent scopes the user request and identifies likely files.
2. Launch one or more subagents with prompts from this directory.
3. Ask each subagent to return only findings, changed-file suggestions, commands run, and residual risks.
4. Parent agent integrates the result, makes the final edits, and runs focused verification.

## Playbooks

- `frontend-alerting-fix.md`: alerting React bugfix or test agent.
- `backend-service-test.md`: backend service unit-test agent.
- `ci-triage.md`: CI failure investigation against `fieldsphere/grafana`.
- `security-rbac-review.md`: auth, RBAC, and permission review.
- `split-pr-scout.md`: creative scout for separating mixed frontend/backend changes.
