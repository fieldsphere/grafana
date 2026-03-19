package featuremgmt

import (
	"context"
	"sort"

	featuretoggleapi "github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
)

// ResolveToggleState builds a complete, sorted view of registered feature flags
// so the frontend can inspect both enabled and disabled entries.
func ResolveToggleState(ctx context.Context, toggles FeatureToggles) featuretoggleapi.ResolvedToggleState {
	enabled := toggles.GetEnabled(ctx)
	state := featuretoggleapi.ResolvedToggleState{
		Enabled: enabled,
	}

	manager, ok := toggles.(*FeatureManager)
	if !ok {
		state.Toggles = buildFallbackToggleStatuses(enabled)
		return state
	}

	flags := manager.GetFlags()
	sort.Slice(flags, func(i, j int) bool {
		return flags[i].Name < flags[j].Name
	})

	state.Toggles = make([]featuretoggleapi.ToggleStatus, 0, len(flags))
	for _, flag := range flags {
		state.Toggles = append(state.Toggles, featuretoggleapi.ToggleStatus{
			Name:            flag.Name,
			Description:     flag.Description,
			Stage:           flag.Stage.String(),
			Enabled:         enabled[flag.Name],
			Writeable:       false,
			Warning:         manager.warnings[flag.Name],
			RequiresDevMode: flag.RequiresDevMode,
			FrontendOnly:    flag.FrontendOnly,
			HideFromDocs:    flag.HideFromDocs,
			RequiresRestart: flag.RequiresRestart,
		})
	}

	return state
}

func buildFallbackToggleStatuses(enabled map[string]bool) []featuretoggleapi.ToggleStatus {
	keys := make([]string, 0, len(enabled))
	for key := range enabled {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	toggles := make([]featuretoggleapi.ToggleStatus, 0, len(keys))
	for _, key := range keys {
		toggles = append(toggles, featuretoggleapi.ToggleStatus{
			Name:    key,
			Stage:   FeatureStageUnknown.String(),
			Enabled: enabled[key],
		})
	}

	return toggles
}
