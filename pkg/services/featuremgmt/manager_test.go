package featuremgmt

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/setting"
)

func TestFeatureManagerSetFlag(t *testing.T) {
	mgr := &FeatureManager{
		isDevMod:       true,
		flags:          map[string]*FeatureFlag{},
		enabled:        map[string]bool{},
		startup:        map[string]bool{},
		configKeys:     map[string]bool{},
		dbOverrides:    map[string]bool{},
		pendingRestart: map[string]bool{},
		warnings:       map[string]string{},
	}

	mgr.flags["testFlag"] = &FeatureFlag{
		Name:        "testFlag",
		Description: "A test flag",
		Stage:       FeatureStagePublicPreview,
		Expression:  "false",
	}
	mgr.update()

	require.False(t, mgr.IsEnabledGlobally("testFlag"))

	err := mgr.SetFlag("testFlag", true)
	require.NoError(t, err)
	require.True(t, mgr.IsEnabledGlobally("testFlag"))
}

func TestFeatureManagerSetFlagLocked(t *testing.T) {
	mgr := &FeatureManager{
		isDevMod:       true,
		flags:          map[string]*FeatureFlag{"lockedFlag": {Name: "lockedFlag", Expression: "false"}},
		enabled:        map[string]bool{},
		startup:        map[string]bool{"lockedFlag": false},
		configKeys:     map[string]bool{"lockedFlag": true},
		dbOverrides:    map[string]bool{},
		pendingRestart: map[string]bool{},
		warnings:       map[string]string{},
	}
	mgr.update()

	err := mgr.SetFlag("lockedFlag", true)
	require.ErrorIs(t, err, ErrFeatureFlagLocked)
}

func TestFeatureManagerRequiresRestartDoesNotApplyImmediately(t *testing.T) {
	mgr := &FeatureManager{
		isDevMod:       true,
		flags:          map[string]*FeatureFlag{},
		enabled:        map[string]bool{},
		startup:        map[string]bool{},
		configKeys:     map[string]bool{},
		dbOverrides:    map[string]bool{},
		pendingRestart: map[string]bool{},
		warnings:       map[string]string{},
	}

	mgr.flags["restartFlag"] = &FeatureFlag{
		Name:            "restartFlag",
		Expression:      "false",
		RequiresRestart: true,
	}
	mgr.update()

	err := mgr.SetFlag("restartFlag", true)
	require.NoError(t, err)
	require.False(t, mgr.IsEnabledGlobally("restartFlag"))

	state := mgr.GetResolvedState(true)
	require.True(t, state.RestartRequired)
}

func TestFeatureManagerRequiresDevMode(t *testing.T) {
	mgr := &FeatureManager{
		isDevMod:       false,
		flags:          map[string]*FeatureFlag{"devFlag": {Name: "devFlag", RequiresDevMode: true, Expression: "false"}},
		enabled:        map[string]bool{},
		startup:        map[string]bool{},
		configKeys:     map[string]bool{},
		dbOverrides:    map[string]bool{},
		pendingRestart: map[string]bool{},
		warnings:       map[string]string{},
	}
	mgr.update()

	err := mgr.SetFlag("devFlag", true)
	require.ErrorIs(t, err, ErrFeatureFlagRestricted)
}

func TestFeatureManagerGetResolvedState(t *testing.T) {
	mgr := &FeatureManager{
		isDevMod:       true,
		flags: map[string]*FeatureFlag{
			"alpha": {Name: "alpha", Description: "Alpha feature", Stage: FeatureStageExperimental, Expression: "true"},
		},
		enabled:        map[string]bool{"alpha": true},
		startup:        map[string]bool{},
		configKeys:     map[string]bool{},
		dbOverrides:    map[string]bool{},
		pendingRestart: map[string]bool{},
		warnings:       map[string]string{},
	}

	state := mgr.GetResolvedState(true)
	require.True(t, state.AllowEditing)
	require.Len(t, state.Toggles, 1)
	require.Equal(t, "alpha", state.Toggles[0].Name)
	require.Equal(t, "experimental", state.Toggles[0].Stage)
	require.True(t, state.Toggles[0].Enabled)
	require.True(t, state.Toggles[0].Writeable)
}

func TestProvideManagerServiceWithNilStore(t *testing.T) {
	cfg := setting.NewCfg()
	mgmt, err := ProvideManagerService(cfg)
	require.NoError(t, err)
	require.NotNil(t, mgmt)
}
