---
name: codegen-change
description: Handle Grafana code generation after Wire, feature toggle, CUE schema, OpenAPI, or Go workspace changes. Use when edits touch generated-code inputs or generated files.
---

# Codegen Change

## Instructions

1. Identify which generator owns the changed inputs.
2. Run the matching command from the repo root.
3. Review generated diffs for unrelated churn before continuing.
4. Run a focused compile or test for the touched package.

## Generator map

| Input changed | Command |
| --- | --- |
| `pkg/server/wire.go`, service init, provider sets | `make gen-go` |
| `pkg/services/featuremgmt/` feature toggle registry | `make gen-feature-toggles` |
| `kinds/**/*.cue` dashboard or app schemas | `make gen-cue` |
| OpenAPI or Swagger specs | `make swagger-gen` |
| Added or removed Go modules | `make update-workspace` |

## Notes

- Do not hand-edit generated files when a generator exists.
- If the command is expensive, explain why it is needed before running it.
- For unified storage/search changes under `pkg/storage/unified/`, read `pkg/storage/unified/AGENTS.md` before changing generated contracts.
