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

	labsMu      sync.RWMutex
	labsEnabled LabsOverrides // instance-wide Labs overrides (from kv_store)
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
	fm.update()
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
	fm.labsMu.RLock()
	labs := fm.labsEnabled
	fm.labsMu.RUnlock()
	if labs == nil {
		labs = LabsOverrides{}
	}

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
		baseOn := startup || (!ok && flag.Expression == "true")
		if v, hasLab := labs[flag.Name]; hasLab {
			baseOn = v
		}
		if baseOn {
			track = 1
			enabled[flag.Name] = true
		}

		// Register value with prometheus metric
		featureToggleInfo.WithLabelValues(flag.Name).Set(track)
	}
	fm.enabled = enabled
}

// SetLabsOverrides replaces Labs (in-app) overrides and recomputes enabled flags.
func (fm *FeatureManager) SetLabsOverrides(overrides LabsOverrides) {
	fm.labsMu.Lock()
	if overrides == nil {
		fm.labsEnabled = LabsOverrides{}
	} else {
		fm.labsEnabled = make(LabsOverrides, len(overrides))
		for k, v := range overrides {
			fm.labsEnabled[k] = v
		}
	}
	fm.labsMu.Unlock()
	fm.update()
}

// GetLabsOverridesCopy returns a copy of current Labs overrides for persistence.
func (fm *FeatureManager) GetLabsOverridesCopy() LabsOverrides {
	fm.labsMu.RLock()
	defer fm.labsMu.RUnlock()
	if len(fm.labsEnabled) == 0 {
		return LabsOverrides{}
	}
	out := make(LabsOverrides, len(fm.labsEnabled))
	for k, v := range fm.labsEnabled {
		out[k] = v
	}
	return out
}

// LabsWritable reports whether Labs may change this flag at runtime.
func (fm *FeatureManager) LabsWritable(flag *FeatureFlag) bool {
	if flag.RequiresRestart {
		return false
	}
	if flag.RequiresDevMode && !fm.isDevMod {
		return false
	}
	ok, _ := fm.meetsRequirements(flag)
	return ok
}

// ListLabsFlags returns metadata for every registered flag for the Labs UI.
func (fm *FeatureManager) ListLabsFlags(ctx context.Context) []LabsFlagDetail {
	fm.labsMu.RLock()
	labs := fm.labsEnabled
	fm.labsMu.RUnlock()
	if labs == nil {
		labs = LabsOverrides{}
	}

	out := make([]LabsFlagDetail, 0, len(fm.flags))
	for _, flag := range fm.flags {
		ok, reason := fm.meetsRequirements(flag)
		_, inStartup := fm.startup[flag.Name]
		baseOn := false
		if inStartup {
			baseOn = fm.startup[flag.Name]
		} else {
			baseOn = flag.Expression == "true"
		}
		source := "default"
		if inStartup {
			source = "config"
		}
		effective := baseOn
		if v, has := labs[flag.Name]; has {
			effective = v
			source = "labs"
		}

		d := LabsFlagDetail{
			Name:            flag.Name,
			Description:     flag.Description,
			Stage:           flag.Stage.String(),
			FrontendOnly:    flag.FrontendOnly,
			RequiresRestart: flag.RequiresRestart,
			RequiresDevMode: flag.RequiresDevMode,
			Enabled:         effective,
			Source:          source,
			Writable:        fm.LabsWritable(flag),
			MeetsRuntime:    ok,
			BlockedReason:   reason,
		}
		out = append(out, d)
	}
	_ = ctx
	return out
}

// IsEnabled checks if a feature is enabled
func (fm *FeatureManager) IsEnabled(ctx context.Context, flag string) bool {
	return fm.enabled[flag]
}

// IsEnabledGlobally checks if a feature is for all tenants
func (fm *FeatureManager) IsEnabledGlobally(flag string) bool {
	return fm.enabled[flag]
}

// GetEnabled returns a map containing only the features that are enabled
func (fm *FeatureManager) GetEnabled(ctx context.Context) map[string]bool {
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
	v := make([]FeatureFlag, 0, len(fm.flags))
	for _, value := range fm.flags {
		v = append(v, *value)
	}
	return v
}

// GetFlagDefinition returns the registered flag definition, or nil if unknown.
func (fm *FeatureManager) GetFlagDefinition(name string) *FeatureFlag {
	f, ok := fm.flags[name]
	if !ok {
		return nil
	}
	cp := *f
	return &cp
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
