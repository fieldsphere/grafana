package featuremgmt

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/infra/log"
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

	t.Run("runtime override on and off", func(t *testing.T) {
		ft := &FeatureManager{
			flags: map[string]*FeatureFlag{
				"x": {Name: "x", Expression: "false"},
			},
			log:     log.New("test"),
			warnings: map[string]string{},
		}
		ft.isDevMod = true
		ft.startup = map[string]bool{}
		ft.update()
		require.False(t, ft.IsEnabled(context.Background(), "x"))

		require.NoError(t, ft.SetRuntimeOverride("x", true))
		require.True(t, ft.IsEnabled(context.Background(), "x"))
		over := ft.GetRuntimeToggleOverrides()
		require.True(t, over["x"])

		ft.ClearRuntimeOverride("x")
		require.False(t, ft.IsEnabled(context.Background(), "x"))
	})
}
