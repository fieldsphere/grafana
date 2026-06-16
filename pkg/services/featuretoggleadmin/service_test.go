package featuretoggleadmin

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/featuremgmt/persist"
	"github.com/grafana/grafana/pkg/setting"
)

func TestServiceOverrides(t *testing.T) {
	t.Run("configured flags are read-only", func(t *testing.T) {
		cfg := setting.NewCfg()
		section, err := cfg.Raw.NewSection("feature_toggles")
		require.NoError(t, err)
		_, err = section.NewKey("panelTitleSearch", "true")
		require.NoError(t, err)

		manager, err := featuremgmt.ProvideManagerService(cfg)
		require.NoError(t, err)
		service, err := ProvideService(manager, persist.NewFakeStore())
		require.NoError(t, err)

		err = service.SetOverride(context.Background(), "panelTitleSearch", false, "admin")
		require.ErrorIs(t, err, featuremgmt.ErrFeatureFlagReadOnly)
	})

	t.Run("non-restart override applies immediately", func(t *testing.T) {
		manager, err := featuremgmt.ProvideManagerService(setting.NewCfg())
		require.NoError(t, err)
		service, err := ProvideService(manager, persist.NewFakeStore())
		require.NoError(t, err)

		err = service.SetOverride(context.Background(), "panelTitleSearch", true, "admin")
		require.NoError(t, err)
		require.True(t, manager.IsEnabledGlobally("panelTitleSearch"))
	})

	t.Run("restart-required override is pending until restart", func(t *testing.T) {
		manager, err := featuremgmt.ProvideManagerService(setting.NewCfg())
		require.NoError(t, err)
		service, err := ProvideService(manager, persist.NewFakeStore())
		require.NoError(t, err)

		err = service.SetOverride(context.Background(), "live.runAPIServer", true, "admin")
		require.NoError(t, err)
		require.False(t, manager.IsEnabledGlobally("live.runAPIServer"))

		state := service.GetResolvedState(context.Background(), true)
		require.True(t, state.RestartRequired)
	})

	t.Run("load overrides at startup", func(t *testing.T) {
		cfg := setting.NewCfg()
		manager, err := featuremgmt.ProvideManagerService(cfg)
		require.NoError(t, err)

		fakeStore := persist.NewFakeStore()
		require.NoError(t, fakeStore.Set(context.Background(), "panelTitleSearch", true))

		service, err := ProvideService(manager, fakeStore)
		require.NoError(t, err)
		require.NotNil(t, service)
		require.True(t, manager.IsEnabledGlobally("panelTitleSearch"))
	})
}
