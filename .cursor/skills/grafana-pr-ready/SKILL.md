---
name: grafana-pr-ready
description: Prepare a Grafana change for pull request review. Use when the user asks to open a PR, make a branch ready, summarize changes, or verify work before pushing.
---

# Grafana PR Ready

## Instructions

1. Check `git status --short --branch` and inspect the diff.
2. Confirm the work is focused; if frontend and backend changes are unrelated, recommend split PRs.
3. Run the narrowest relevant verification command.
4. Summarize changed files, tests, and remaining risk before any push.
5. For GitHub context, target `fieldsphere/grafana` unless the user explicitly says upstream.

## Verification defaults

- Go package change: `go test -run TestName ./pkg/services/domain/`
- React or TypeScript test: `yarn jest --no-watch path/to/file.test.tsx`
- Docs-only change: review rendered Markdown/front matter; avoid code test churn.
- Codegen input change: use the `codegen-change` skill first.

## PR body checklist

- Clear summary of user-visible behavior.
- Focused test evidence.
- `Resolves ABC-123` when the task is for a Linear ticket.
- No local manifests, env files, credentials, or generated cache artifacts.
