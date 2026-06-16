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
	mu sync.RWMutex

	isDevMod bool

	flags             map[string]*FeatureFlag
	enabled           map[string]bool   // only the "on" values
	startup           map[string]bool   // the explicit values registered at startup
	overrides         map[string]bool   // admin persisted overrides
	appliedOverrides  map[string]bool   // overrides applied to runtime evaluation
	warnings          map[string]string // potential warnings about the flag
	log               log.Logger
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

	fm.update()
}

// meetsRequirements checks if grafana is able to run the given feature due to dev mode or licensing requirements
func (fm *FeatureManager) meetsRequirements(ff *FeatureFlag) (bool, string) {
	if ff.RequiresDevMode && !fm.isDevMod {
		return false, "requires dev mode"
	}

	return true, ""
}

func (fm *FeatureManager) update() {
	fm.mu.Lock()
	defer fm.mu.Unlock()
	fm.updateLocked()
}

func (fm *FeatureManager) updateLocked() {
	enabled := make(map[string]bool)
	for _, flag := range fm.flags {
		ok, reason := fm.meetsRequirements(flag)
		if !ok {
			fm.warnings[flag.Name] = reason
			featureToggleInfo.WithLabelValues(flag.Name).Set(0)
			continue
		}

		delete(fm.warnings, flag.Name)

		isEnabled := fm.resolveEnabledLocked(flag)
		track := 0.0
		if isEnabled {
			track = 1
			enabled[flag.Name] = true
		}
		featureToggleInfo.WithLabelValues(flag.Name).Set(track)
	}
	fm.enabled = enabled
}

func (fm *FeatureManager) resolveEnabledLocked(flag *FeatureFlag) bool {
	if configured, ok := fm.startup[flag.Name]; ok {
		return configured
	}

	if applied, ok := fm.appliedOverrides[flag.Name]; ok {
		return applied
	}

	return flag.Expression == "true"
}

func (fm *FeatureManager) isWriteableLocked(flag *FeatureFlag) bool {
	if _, configured := fm.startup[flag.Name]; configured {
		return false
	}
	ok, _ := fm.meetsRequirements(flag)
	return ok
}

// LoadPersistedOverrides applies stored overrides during startup.
func (fm *FeatureManager) LoadPersistedOverrides(overrides map[string]bool) {
	fm.mu.Lock()
	defer fm.mu.Unlock()

	for name, enabled := range overrides {
		if _, ok := fm.flags[name]; !ok {
			continue
		}
		fm.overrides[name] = enabled
		fm.appliedOverrides[name] = enabled
	}
	fm.updateLocked()
}

// SetOverrideRuntimeState updates in-memory override state.
func (fm *FeatureManager) SetOverrideRuntimeState(name string, enabled bool, applyImmediately bool) (previousEnabled bool, err error) {
	fm.mu.Lock()
	defer fm.mu.Unlock()

	flag, ok := fm.flags[name]
	if !ok {
		return false, ErrUnknownFeatureFlag
	}
	if _, configured := fm.startup[name]; configured {
		return false, ErrFeatureFlagReadOnly
	}
	if !fm.isWriteableLocked(flag) {
		return false, ErrFeatureFlagNotWriteable
	}

	previousEnabled = fm.enabled[name]
	fm.overrides[name] = enabled
	if applyImmediately {
		fm.appliedOverrides[name] = enabled
		fm.updateLocked()
	}
	return previousEnabled, nil
}

// RevertOverrideRuntimeState rolls back an in-memory override change.
func (fm *FeatureManager) RevertOverrideRuntimeState(name string) {
	fm.mu.Lock()
	defer fm.mu.Unlock()
	delete(fm.overrides, name)
}

// ClearOverrideRuntimeState removes an override from runtime evaluation.
func (fm *FeatureManager) ClearOverrideRuntimeState(name string, applyImmediately bool) (previousEnabled bool, err error) {
	fm.mu.Lock()
	defer fm.mu.Unlock()

	if _, ok := fm.flags[name]; !ok {
		return false, ErrUnknownFeatureFlag
	}
	if _, configured := fm.startup[name]; configured {
		return false, ErrFeatureFlagReadOnly
	}
	if _, ok := fm.overrides[name]; !ok {
		return fm.enabled[name], nil
	}

	previousEnabled = fm.enabled[name]
	delete(fm.overrides, name)
	if applyImmediately {
		delete(fm.appliedOverrides, name)
		fm.updateLocked()
	}
	return previousEnabled, nil
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
		if idx < count && reflect.TypeOf(spec[idx]).Kind() == reflect.Bool { // #nosec G602 -- bounds checked by `idx < count`
			val = spec[idx].(bool) // #nosec G602 -- bounds checked by `idx < count`
			idx++
		}

		features[key] = &FeatureFlag{Name: key}
		if val {
			enabled[key] = true
		}
	}

	return &FeatureManager{
		enabled:          enabled,
		flags:            features,
		startup:          enabled,
		overrides:        map[string]bool{},
		appliedOverrides: map[string]bool{},
		warnings:         map[string]string{},
	}
}
