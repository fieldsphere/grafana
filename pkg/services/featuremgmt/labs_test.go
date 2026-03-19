package featuremgmt

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestResolveToggleState(t *testing.T) {
	manager := &FeatureManager{
		isDevMod: false,
		flags:    map[string]*FeatureFlag{},
		enabled:  map[string]bool{},
		startup: map[string]bool{
			"alphaFeature": true,
			"devFeature":   true,
		},
		warnings: map[string]string{},
	}

	manager.registerFlags(
		FeatureFlag{
			Name:        "betaFeature",
			Description: "Beta feature",
			Stage:       FeatureStageExperimental,
			Expression:  "false",
		},
		FeatureFlag{
			Name:            "devFeature",
			Description:     "Dev-only feature",
			Stage:           FeatureStagePrivatePreview,
			Expression:      "true",
			RequiresDevMode: true,
		},
		FeatureFlag{
			Name:            "alphaFeature",
			Description:     "Alpha feature",
			Stage:           FeatureStagePublicPreview,
			Expression:      "true",
			FrontendOnly:    true,
			RequiresRestart: true,
		},
	)

	state := ResolveToggleState(context.Background(), manager)
	require.Equal(t, map[string]bool{"alphaFeature": true}, state.Enabled)
	require.Len(t, state.Toggles, 3)

	require.Equal(t, "alphaFeature", state.Toggles[0].Name)
	require.True(t, state.Toggles[0].Enabled)
	require.True(t, state.Toggles[0].FrontendOnly)
	require.True(t, state.Toggles[0].RequiresRestart)

	require.Equal(t, "betaFeature", state.Toggles[1].Name)
	require.False(t, state.Toggles[1].Enabled)
	require.Equal(t, FeatureStageExperimental.String(), state.Toggles[1].Stage)

	require.Equal(t, "devFeature", state.Toggles[2].Name)
	require.False(t, state.Toggles[2].Enabled)
	require.True(t, state.Toggles[2].RequiresDevMode)
	require.Equal(t, "requires dev mode", state.Toggles[2].Warning)
}
