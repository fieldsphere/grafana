package live

import (
	"testing"

	"github.com/grafana/grafana-app-sdk/app"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
	grafanalive "github.com/grafana/grafana/pkg/services/live"
	"github.com/grafana/grafana/pkg/setting"
)

func TestRegisterAppInstallerWiresTransportHandlers(t *testing.T) {
	cfg := setting.NewCfg()
	gl := &grafanalive.GrafanaLive{}

	installer, err := RegisterAppInstaller(cfg, featuremgmt.WithFeatures(), gl)
	require.NoError(t, err)
	require.NotNil(t, installer)
	require.NotNil(t, installer.AppInstaller)
}

func TestStreamIDFromRequest(t *testing.T) {
	require.Equal(t, "metrics", streamIDFromRequest(&app.CustomRouteRequest{Path: "push/metrics"}))
	require.Equal(t, "abc", streamIDFromRequest(&app.CustomRouteRequest{Path: "/push/abc/"}))
}
