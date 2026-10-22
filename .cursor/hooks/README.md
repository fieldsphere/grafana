# Cursor Hook Demo Pack

These project hooks demonstrate safe agent guardrails for Grafana. They run from the repo root and exchange JSON with Cursor over stdin/stdout.

## Active hooks

- `enforce-fieldsphere-gh.sh`: blocks mutating `gh` commands unless they target `fieldsphere/grafana`.
- `guard-git-push.sh`: asks for confirmation before `git push` so the agent can summarize branch, commits, and verification.
- `advise-jest-no-watch.sh`: allows frontend test commands but reminds agents to avoid Jest watch mode.
- `protect-local-artifacts.sh`: asks before staging or committing likely local-only artifacts such as env files, credentials, or generated manifest JSON files.

## Opt-in demo ideas

Use these as workshop extensions when you want visible automation beyond guardrails:

- Codegen reminder hook: after edits to `pkg/server/wire.go`, `pkg/services/featuremgmt/registry.go`, `kinds/**/*.cue`, or OpenAPI files, add follow-up context that points to `make gen-go`, `make gen-feature-toggles`, `make gen-cue`, or `make swagger-gen`.
- Split-PR scout hook: after edits that span both `pkg/` and `public/app/`, remind the agent that Grafana prefers separate frontend and backend PRs because they deploy at different cadences.

Keep expensive checks in skills or explicit commands. Hooks should stay fast, deterministic, and easy to reason about.
