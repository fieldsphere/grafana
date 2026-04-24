package featuremgmt

import "fmt"

// In-memory server-side / Labs feature toggle overrides. Persistence is in pkg/api (avoids import cycles with kvstore).

// GetRuntimeToggleOverrides returns a copy of runtime overrides, if any.
func (fm *FeatureManager) GetRuntimeToggleOverrides() map[string]bool {
	if len(fm.runtimeToggles) == 0 {
		return nil
	}
	out := make(map[string]bool, len(fm.runtimeToggles))
	for k, v := range fm.runtimeToggles {
		out[k] = v
	}
	return out
}

// ReplaceRuntimeToggles replaces the entire override map and re-evaluates. Used when loading from KV.
func (fm *FeatureManager) ReplaceRuntimeToggles(over map[string]bool) {
	if len(over) == 0 {
		fm.runtimeToggles = nil
	} else {
		fm.runtimeToggles = make(map[string]bool, len(over))
		for k, v := range over {
			fm.runtimeToggles[k] = v
		}
	}
	fm.update()
}

// setRuntimeOverride sets a single override for a known registered flag.
func (fm *FeatureManager) setRuntimeOverride(name string, on bool) {
	if fm.runtimeToggles == nil {
		fm.runtimeToggles = make(map[string]bool)
	}
	fm.runtimeToggles[name] = on
	fm.update()
}

// SetRuntimeOverride validates the flag and applies an override.
func (fm *FeatureManager) SetRuntimeOverride(name string, on bool) error {
	if _, ok := fm.flags[name]; !ok {
		return fmt.Errorf("unknown feature toggle: %s", name)
	}
	fm.setRuntimeOverride(name, on)
	return nil
}

// clearRuntimeOverrideByName removes an override for a name.
func (fm *FeatureManager) clearRuntimeOverrideByName(name string) {
	if fm.runtimeToggles == nil {
		return
	}
	delete(fm.runtimeToggles, name)
	if len(fm.runtimeToggles) == 0 {
		fm.runtimeToggles = nil
	}
	fm.update()
}

// ClearRuntimeOverride removes a runtime override; exposed for Labs API in pkg/api.
func (fm *FeatureManager) ClearRuntimeOverride(name string) {
	fm.clearRuntimeOverrideByName(name)
}

// SnapshotRuntimeToggles returns a copy for JSON persistence.
func (fm *FeatureManager) SnapshotRuntimeToggles() map[string]bool {
	if len(fm.runtimeToggles) == 0 {
		return nil
	}
	return fm.GetRuntimeToggleOverrides()
}
