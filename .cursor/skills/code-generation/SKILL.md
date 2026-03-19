---
name: code-generation
description: Run Grafana code generation commands (Wire, CUE, Swagger, feature toggles). Use when the user changes service init, kinds, API specs, or feature flags.
---

# Code Generation

## Instructions

When the user modifies code that requires regeneration, run the matching command from the repo root.

| Change | Command |
|--------|---------|
| Service init / Wire DI | `make gen-go` |
| Dashboard/panel schemas (kinds/) | `make gen-cue` |
| App SDK apps | `make gen-apps` |
| OpenAPI/Swagger specs | `make swagger-gen` |
| Feature flags (featuremgmt/) | `make gen-feature-toggles` |
| i18n strings | `make i18n-extract` |
| New Go modules | `make update-workspace` |

## Notes

- `make gen-go` is required after changing service initialization; Wire catches circular deps at compile time.
- Run `make gen-cue` after editing files under `kinds/`.
- Run `make update-workspace` when adding new Go modules to the workspace.
