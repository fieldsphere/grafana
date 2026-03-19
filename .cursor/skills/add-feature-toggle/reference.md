# Feature Toggle Reference

## Location

`pkg/services/featuremgmt/`

## Definition Format

Flags are defined in the registry; `make gen-feature-toggles` generates:
- Go: `featuremgmt.Flags.<FlagName>`
- TypeScript: via generated or config layer

## Backend Usage (Go)

```go
import "github.com/grafana/grafana/pkg/services/featuremgmt"

if cfg.FeatureManagement.IsEnabled(ctx, featuremgmt.Flags.MyNewFeature) {
    // gated behavior
}
```

## Frontend Usage

Feature flags are typically exposed via config or API; check `public/app/core/` for feature flag access patterns.

## Regeneration

```bash
make gen-feature-toggles
```

Run after any change to flag definitions. Generated code lives in `pkg/services/featuremgmt/` (or generated subdir).
