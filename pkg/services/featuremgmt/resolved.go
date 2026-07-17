package featuremgmt

import (
	"context"
	"fmt"
	"sort"

	common "github.com/grafana/grafana/pkg/apimachinery/apis/common/v0alpha1"
	featuretoggleapi "github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
)

func sourceRef(name string) *common.ObjectReference {
	return &common.ObjectReference{Name: name}
}

func (fm *FeatureManager) GetResolvedState(allowEditing bool) featuretoggleapi.ResolvedToggleState {
	fm.mu.RLock()
	defer fm.mu.RUnlock()

	enabled := make(map[string]bool, len(fm.enabled))
	for key, val := range fm.enabled {
		if val {
			enabled[key] = true
		}
	}

	toggles := make([]featuretoggleapi.ToggleStatus, 0, len(fm.flags))
	names := make([]string, 0, len(fm.flags))
	for name := range fm.flags {
		names = append(names, name)
	}
	sort.Strings(names)

	restartRequired := fm.restartRequired

	for _, name := range names {
		flag := fm.flags[name]
		isEnabled := fm.enabled[name]
		writeable := allowEditing && fm.isWriteableLocked(flag, name)

		status := featuretoggleapi.ToggleStatus{
			Name:        name,
			Description: flag.Description,
			Stage:       flag.Stage.String(),
			Enabled:     isEnabled,
			Writeable:   writeable,
		}

		if warning, ok := fm.warnings[name]; ok {
			status.Warning = warning
		}

		if fm.configKeys[name] {
			status.Source = sourceRef("config")
			status.Writeable = false
		} else if _, ok := fm.dbOverrides[name]; ok {
			status.Source = sourceRef("database")
		} else if _, ok := fm.startup[name]; ok {
			status.Source = sourceRef("startup")
		}

		if flag.RequiresRestart {
			if pending, ok := fm.pendingRestart[name]; ok && pending != isEnabled {
				status.Warning = "Change will apply after restart"
				restartRequired = true
			}
		}

		if !writeable && fm.configKeys[name] {
			if status.Warning == "" {
				status.Warning = "Locked by configuration"
			}
		}

		toggles = append(toggles, status)
	}

	return featuretoggleapi.ResolvedToggleState{
		AllowEditing:    allowEditing,
		RestartRequired: restartRequired,
		Enabled:         enabled,
		Toggles:         toggles,
	}
}

func (fm *FeatureManager) isWriteableLocked(flag *FeatureFlag, name string) bool {
	if fm.configKeys[name] {
		return false
	}
	ok, _ := fm.meetsRequirements(flag)
	return ok
}

func (fm *FeatureManager) SetFlag(name string, enabled bool) error {
	fm.mu.Lock()
	defer fm.mu.Unlock()

	flag, ok := fm.flags[name]
	if !ok {
		return ErrUnknownFeatureFlag
	}

	if fm.configKeys[name] {
		return ErrFeatureFlagLocked
	}

	if ok, reason := fm.meetsRequirements(flag); !ok {
		return fmt.Errorf("%w: %s", ErrFeatureFlagRestricted, reason)
	}

	fm.dbOverrides[name] = enabled

	if flag.RequiresRestart {
		fm.pendingRestart[name] = enabled
		fm.recomputeRestartRequiredLocked()
		return nil
	}

	fm.startup[name] = enabled
	fm.updateLocked()
	return nil
}

func (fm *FeatureManager) RemoveOverride(name string) error {
	fm.mu.Lock()
	defer fm.mu.Unlock()

	flag, ok := fm.flags[name]
	if !ok {
		return ErrUnknownFeatureFlag
	}

	if fm.configKeys[name] {
		return ErrFeatureFlagLocked
	}

	delete(fm.dbOverrides, name)
	delete(fm.pendingRestart, name)

	if flag.RequiresRestart {
		fm.recomputeRestartRequiredLocked()
		return nil
	}

	delete(fm.startup, name)
	fm.updateLocked()
	return nil
}

func (fm *FeatureManager) IsEnabled(ctx context.Context, flag string) bool {
	fm.mu.RLock()
	defer fm.mu.RUnlock()
	return fm.enabled[flag]
}

func (fm *FeatureManager) IsEnabledGlobally(flag string) bool {
	fm.mu.RLock()
	defer fm.mu.RUnlock()
	return fm.enabled[flag]
}

func (fm *FeatureManager) GetEnabled(ctx context.Context) map[string]bool {
	fm.mu.RLock()
	defer fm.mu.RUnlock()

	enabled := make(map[string]bool, len(fm.enabled))
	for key, val := range fm.enabled {
		if val {
			enabled[key] = true
		}
	}
	return enabled
}

func (fm *FeatureManager) GetFlags() []FeatureFlag {
	fm.mu.RLock()
	defer fm.mu.RUnlock()

	v := make([]FeatureFlag, 0, len(fm.flags))
	for _, value := range fm.flags {
		v = append(v, *value)
	}
	return v
}

func (fm *FeatureManager) EnabledSnapshot(name string) bool {
	fm.mu.RLock()
	defer fm.mu.RUnlock()
	return fm.enabled[name]
}

func (fm *FeatureManager) CurrentValue(name string) (bool, bool) {
	fm.mu.RLock()
	defer fm.mu.RUnlock()
	val, ok := fm.enabled[name]
	return val, ok
}

func (fm *FeatureManager) recomputeRestartRequiredLocked() {
	fm.restartRequired = false
	for name, pending := range fm.pendingRestart {
		if pending != fm.enabled[name] {
			fm.restartRequired = true
			return
		}
	}
}

func (fm *FeatureManager) applyOverrides(overrides map[string]bool) {
	fm.mu.Lock()
	defer fm.mu.Unlock()

	for name, enabled := range overrides {
		if fm.configKeys[name] {
			continue
		}
		fm.dbOverrides[name] = enabled
		flag, ok := fm.flags[name]
		if !ok {
			continue
		}
		fm.startup[name] = enabled
		if flag.RequiresRestart {
			fm.pendingRestart[name] = enabled
		}
	}
	fm.recomputeRestartRequiredLocked()
}
