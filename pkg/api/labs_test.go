package api

import (
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestAPI_LabsFeatureToggles(t *testing.T) {
	cfg := setting.NewCfg()
	features, err := featuremgmt.ProvideManagerService(cfg)
	require.NoError(t, err)

	t.Run("should return feature flags for settings readers", func(t *testing.T) {
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = cfg
			hs.Features = features
		})

		res, err := server.Send(webtest.RequestWithSignedInUser(
			server.NewGetRequest("/api/labs/feature-toggles"),
			userWithPermissions(1, []accesscontrol.Permission{{
				Action: accesscontrol.ActionSettingsRead,
				Scope:  accesscontrol.ScopeSettingsAll,
			}}),
		))
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)

		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		assert.Contains(t, string(body), `"toggles"`)
		assert.Contains(t, string(body), `"panelTitleSearch"`)
		require.NoError(t, res.Body.Close())
	})

	t.Run("should reject users without settings access", func(t *testing.T) {
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = cfg
			hs.Features = features
		})

		res, err := server.Send(webtest.RequestWithSignedInUser(
			server.NewGetRequest("/api/labs/feature-toggles"),
			userWithPermissions(1, []accesscontrol.Permission{{
				Action: "wrong",
			}}),
		))
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})
}
