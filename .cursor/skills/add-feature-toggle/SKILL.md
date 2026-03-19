---
name: add-feature-toggle
description: Add or modify feature flags in Grafana. Use when adding feature toggles, gating new features, or changing feature flag definitions.
---

# Add Feature Toggle

## Quick Start

1. Add or edit the toggle in `pkg/services/featuremgmt/`
2. Run `make gen-feature-toggles` to regenerate code
3. Use the generated flag in backend or frontend (see [reference.md](reference.md))

## Workflow

1. Locate `pkg/services/featuremgmt/registry.go` (or equivalent)
2. Add flag with name, description, default state
3. Run `make gen-feature-toggles`
4. Use `featuremgmt.Flags.<FlagName>` in Go or equivalent in frontend

## Notes

- Feature toggles allow gradual rollout and A/B testing
- Default state matters for backward compatibility
- Regeneration is required after any change

## Additional Resources

- For flag definition format and usage patterns, see [reference.md](reference.md)
