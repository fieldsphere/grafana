package api

import (
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/featuremgmt/persist"
	"github.com/grafana/grafana/pkg/services/featuretoggleadmin"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestAPI_AdminFeatureToggles(t *testing.T) {
	t.Run("read requires featuremgmt.read permission", func(t *testing.T) {
		server := setupFeatureToggleAPIServer(t)

		res, err := server.Send(webtest.RequestWithSignedInUser(server.NewGetRequest("/api/admin/feature-toggles"), userWithPermissions(1, []accesscontrol.Permission{
			{Action: accesscontrol.ActionFeatureManagementRead},
		})))
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})

	t.Run("read denied without permission", func(t *testing.T) {
		server := setupFeatureToggleAPIServer(t)

		res, err := server.Send(webtest.RequestWithSignedInUser(server.NewGetRequest("/api/admin/feature-toggles"), userWithPermissions(1, nil)))
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})

	t.Run("write updates non-restart flag", func(t *testing.T) {
		server := setupFeatureToggleAPIServer(t)

		res, err := server.Send(webtest.RequestWithSignedInUser(
			server.NewRequest(http.MethodPut, "/api/admin/feature-toggles/panelTitleSearch", strings.NewReader(`{"enabled":true}`)),
			userWithPermissions(1, []accesscontrol.Permission{
				{Action: accesscontrol.ActionFeatureManagementWrite},
			}),
		))
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)
		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		assert.Contains(t, string(body), `"panelTitleSearch"`)
		require.NoError(t, res.Body.Close())
	})
}

func setupFeatureToggleAPIServer(t *testing.T) *webtest.Server {
	t.Helper()

	cfg := setting.NewCfg()
	manager, err := featuremgmt.ProvideManagerService(cfg)
	require.NoError(t, err)
	store := persist.NewFakeStore()
	admin, err := featuretoggleadmin.ProvideService(manager, store)
	require.NoError(t, err)

	return SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Cfg = cfg
		hs.Features = manager
		hs.FeatureToggleAdmin = admin
	})
}
