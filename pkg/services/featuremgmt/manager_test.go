package featuremgmt

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestFeatureManager(t *testing.T) {
	t.Run("check testing stubs", func(t *testing.T) {
		ft := WithManager("a", "b", "c")
		require.True(t, ft.IsEnabledGlobally("a"))
		require.True(t, ft.IsEnabledGlobally("b"))
		require.True(t, ft.IsEnabledGlobally("c"))
		require.False(t, ft.IsEnabledGlobally("d"))

		require.Equal(t, map[string]bool{"a": true, "b": true, "c": true}, ft.GetEnabled(context.Background()))

		// Explicit values
		ft = WithManager("a", true, "b", false)
		require.True(t, ft.IsEnabledGlobally("a"))
		require.False(t, ft.IsEnabledGlobally("b"))
		require.Equal(t, map[string]bool{"a": true}, ft.GetEnabled(context.Background()))
	})

	t.Run("check description and stage configs", func(t *testing.T) {
		ft := FeatureManager{
			flags: map[string]*FeatureFlag{},
		}
		ft.registerFlags(FeatureFlag{
			Name:        "a",
			Description: "first",
		}, FeatureFlag{
			Name:        "a",
			Description: "second",
		}, FeatureFlag{
			Name:  "a",
			Stage: FeatureStagePrivatePreview,
		}, FeatureFlag{
			Name: "a",
		})
		flag := ft.flags["a"]
		require.Equal(t, "second", flag.Description)
		require.Equal(t, FeatureStagePrivatePreview, flag.Stage)
	})

	t.Run("check startup false flags", func(t *testing.T) {
		ft := FeatureManager{
			flags: map[string]*FeatureFlag{},
			startup: map[string]bool{
				"a": true,
				"b": false, // but default true
			},
		}
		ft.registerFlags(FeatureFlag{
			Name: "a",
		}, FeatureFlag{
			Name:       "b",
			Expression: "true",
		}, FeatureFlag{
			Name: "c",
		})
		require.True(t, ft.IsEnabledGlobally("a"))
		require.False(t, ft.IsEnabledGlobally("b"))
		require.False(t, ft.IsEnabledGlobally("c"))
	})

	t.Run("set startup state updates runtime values", func(t *testing.T) {
		ft := WithManager("a", true, "b", false)

		require.NoError(t, ft.SetStartupState("b", true))
		require.True(t, ft.IsEnabledGlobally("b"))

		require.NoError(t, ft.SetStartupState("a", false))
		require.False(t, ft.IsEnabledGlobally("a"))

		err := ft.SetStartupState("missing", true)
		require.ErrorIs(t, err, ErrFeatureFlagNotFound)
	})

	t.Run("snapshot returns matching flags and enabled states", func(t *testing.T) {
		ft := &FeatureManager{
			flags: map[string]*FeatureFlag{
				"a": {Name: "a", Expression: "true"},
				"b": {Name: "b"},
			},
			startup: map[string]bool{
				"a": false,
				"b": true,
			},
			warnings: map[string]string{},
		}
		ft.update()

		flags, enabled := ft.GetSnapshot()
		require.Len(t, flags, 2)
		require.Equal(t, map[string]bool{"b": true}, enabled)

		names := make(map[string]bool, len(flags))
		for _, flag := range flags {
			names[flag.Name] = true
		}

		require.Equal(t, map[string]bool{"a": true, "b": true}, names)
	})

	t.Run("with manager keeps startup separate from enabled", func(t *testing.T) {
		ft := WithManager("a", true)

		ft.startup["a"] = false

		require.True(t, ft.enabled["a"])
	})
}
