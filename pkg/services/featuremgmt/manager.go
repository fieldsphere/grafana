package featuremgmt

import (
	"context"
	"fmt"
	"reflect"
	"sync"

	"github.com/grafana/grafana/pkg/infra/log"
)

var (
	_ FeatureToggles = (*FeatureManager)(nil)
)

type FeatureManager struct {
	isDevMod bool

	flags    map[string]*FeatureFlag
	enabled  map[string]bool   // only the "on" values
	startup  map[string]bool   // the explicit values registered at startup
	warnings map[string]string // potential warnings about the flag
	log      log.Logger

	mu          sync.RWMutex
	labOverride map[string]bool // instance-wide overrides from Labs (DB)
}

// This will merge the flags with the current configuration
func (fm *FeatureManager) registerFlags(flags ...FeatureFlag) {
	for _, add := range flags {
		if add.Name == "" {
			continue // skip it with warning?
		}
		flag, ok := fm.flags[add.Name]
		if !ok {
			f := add // make a copy
			fm.flags[add.Name] = &f
			continue
		}

		// Selectively update properties
		if add.Description != "" {
			flag.Description = add.Description
		}
		if add.Expression != "" {
			flag.Expression = add.Expression
		}

		// The most recently defined state
		if add.Stage != FeatureStageUnknown {
			flag.Stage = add.Stage
		}

		// Only gets more restrictive
		if add.RequiresDevMode {
			flag.RequiresDevMode = true
		}

		if add.RequiresRestart {
			flag.RequiresRestart = true
		}
	}

	// This will evaluate all flags
	fm.mu.Lock()
	fm.updateLocked()
	fm.mu.Unlock()
}

// meetsRequirements checks if grafana is able to run the given feature due to dev mode or licensing requirements
func (fm *FeatureManager) meetsRequirements(ff *FeatureFlag) (bool, string) {
	if ff.RequiresDevMode && !fm.isDevMod {
		return false, "requires dev mode"
	}

	return true, ""
}

// Update
func (fm *FeatureManager) update() {
	fm.mu.Lock()
	defer fm.mu.Unlock()
	fm.updateLocked()
}

func (fm *FeatureManager) updateLocked() {
	enabled := make(map[string]bool)
	for _, flag := range fm.flags {
		// if grafana cannot run the feature, omit metrics around it
		ok, reason := fm.meetsRequirements(flag)
		if !ok {
			fm.warnings[flag.Name] = reason
			continue
		}

		// Update the registry
		track := 0.0

		startup, ok := fm.startup[flag.Name]
		if startup || (!ok && flag.Expression == "true") {
			track = 1
			enabled[flag.Name] = true
		}

		if ov, hasLab := fm.labOverride[flag.Name]; hasLab {
			if ov {
				track = 1
				enabled[flag.Name] = true
			} else {
				track = 0
				delete(enabled, flag.Name)
			}
		}

		// Register value with prometheus metric
		featureToggleInfo.WithLabelValues(flag.Name).Set(track)
	}
	fm.enabled = enabled
}

// SetLabOverrides replaces in-memory Labs overrides and recomputes enabled flags.
func (fm *FeatureManager) SetLabOverrides(overrides map[string]bool) {
	fm.mu.Lock()
	defer fm.mu.Unlock()
	if overrides == nil {
		fm.labOverride = nil
	} else {
		fm.labOverride = make(map[string]bool, len(overrides))
		for k, v := range overrides {
			fm.labOverride[k] = v
		}
	}
	fm.updateLocked()
}

// IsEnabled checks if a feature is enabled
func (fm *FeatureManager) IsEnabled(ctx context.Context, flag string) bool {
	fm.mu.RLock()
	defer fm.mu.RUnlock()
	return fm.enabled[flag]
}

// IsEnabledGlobally checks if a feature is for all tenants
func (fm *FeatureManager) IsEnabledGlobally(flag string) bool {
	fm.mu.RLock()
	defer fm.mu.RUnlock()
	return fm.enabled[flag]
}

// GetEnabled returns a map containing only the features that are enabled
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

// GetFlags returns all flag definitions
func (fm *FeatureManager) GetFlags() []FeatureFlag {
	fm.mu.RLock()
	defer fm.mu.RUnlock()
	v := make([]FeatureFlag, 0, len(fm.flags))
	for _, value := range fm.flags {
		v = append(v, *value)
	}
	return v
}

// LabOverrides returns a copy of current Labs DB override map.
func (fm *FeatureManager) LabOverrides() map[string]bool {
	fm.mu.RLock()
	defer fm.mu.RUnlock()
	if len(fm.labOverride) == 0 {
		return nil
	}
	out := make(map[string]bool, len(fm.labOverride))
	for k, v := range fm.labOverride {
		out[k] = v
	}
	return out
}

// WarnLabsOverrideLoad logs a non-fatal error when Labs overrides cannot be read from the database.
func (fm *FeatureManager) WarnLabsOverrideLoad(err error) {
	fm.log.Warn("Failed to load Labs feature toggle overrides from database", "err", err)
}

// WarningForFlag returns a warning string for a flag if one exists (e.g. unknown config flag).
func (fm *FeatureManager) WarningForFlag(name string) (string, bool) {
	fm.mu.RLock()
	defer fm.mu.RUnlock()
	w, ok := fm.warnings[name]
	return w, ok
}

// ############# Test Functions #############

func WithFeatures(spec ...any) FeatureToggles {
	return WithManager(spec...)
}

// WithFeatures is used to define feature toggles for testing.
// The arguments are a list of strings that are optionally followed by a boolean value for example:
// WithFeatures([]any{"my_feature", "other_feature"}) or WithFeatures([]any{"my_feature", true})
func WithManager(spec ...any) *FeatureManager {
	count := len(spec)
	features := make(map[string]*FeatureFlag, count)
	enabled := make(map[string]bool, count)

	idx := 0
	for idx < count {
		key := fmt.Sprintf("%v", spec[idx])
		val := true
		idx++
		if idx < count && reflect.TypeOf(spec[idx]).Kind() == reflect.Bool {
			val = spec[idx].(bool)
			idx++
		}

		features[key] = &FeatureFlag{Name: key}
		if val {
			enabled[key] = true
		}
	}

	return &FeatureManager{enabled: enabled, flags: features, startup: enabled, warnings: map[string]string{}}
}
