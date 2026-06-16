package featuremgmt

import (
	"sort"

	common "github.com/grafana/grafana/pkg/apimachinery/apis/common/v0alpha1"
	featuretoggleapi "github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
)

// ResolvedToggleState returns the current feature toggle state for admin APIs.
func (fm *FeatureManager) ResolvedToggleState(allowEditing bool) *featuretoggleapi.ResolvedToggleState {
	fm.mu.RLock()
	defer fm.mu.RUnlock()

	state := &featuretoggleapi.ResolvedToggleState{
		AllowEditing: allowEditing,
		Enabled:      make(map[string]bool),
		Toggles:      make([]featuretoggleapi.ToggleStatus, 0, len(fm.flags)),
	}

	for _, flag := range fm.flags {
		status := fm.buildToggleStatusLocked(flag, allowEditing)
		if status.Enabled {
			state.Enabled[flag.Name] = true
		}
		if status.PendingEnabled != nil && *status.PendingEnabled != status.Enabled {
			state.RestartRequired = true
		}
		state.Toggles = append(state.Toggles, status)
	}

	sort.Slice(state.Toggles, func(i, j int) bool {
		return state.Toggles[i].Name < state.Toggles[j].Name
	})

	return state
}

func (fm *FeatureManager) buildToggleStatusLocked(flag *FeatureFlag, allowEditing bool) featuretoggleapi.ToggleStatus {
	status := featuretoggleapi.ToggleStatus{
		Name:        flag.Name,
		Description: flag.Description,
		Stage:       flag.Stage.String(),
		Enabled:     fm.enabled[flag.Name],
	}

	if warning, ok := fm.warnings[flag.Name]; ok {
		status.Warning = warning
	}

	if _, configured := fm.startup[flag.Name]; configured {
		status.Source = &common.ObjectReference{Kind: "configured"}
		status.Writeable = false
		return status
	}

	if override, ok := fm.overrides[flag.Name]; ok {
		status.Source = &common.ObjectReference{Kind: "override"}
		if flag.RequiresRestart {
			pending := override
			status.PendingEnabled = &pending
		}
	} else {
		status.Source = &common.ObjectReference{Kind: "default"}
	}

	status.RequiresRestart = flag.RequiresRestart
	status.Writeable = allowEditing && fm.isWriteableLocked(flag)
	return status
}

func (fm *FeatureManager) FlagRequiresRestart(name string) bool {
	fm.mu.RLock()
	defer fm.mu.RUnlock()
	flag, ok := fm.flags[name]
	return ok && flag.RequiresRestart
}
