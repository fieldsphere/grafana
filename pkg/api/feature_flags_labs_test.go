package api

import (
	"encoding/json"
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

func TestGetLabsFeatureFlags(t *testing.T) {
	cfg := setting.NewCfg()
	fm, err := featuremgmt.ProvideManagerService(cfg)
	require.NoError(t, err)

	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Cfg = cfg
		hs.Features = fm
	})

	t.Run("returns 403 without featuremgmt.read", func(t *testing.T) {
		req := webtest.RequestWithSignedInUser(
			server.NewGetRequest("/api/featuremgmt/labs-flags"),
			userWithPermissions(1, []accesscontrol.Permission{{Action: "datasources:read"}}),
		)
		res, err := server.Send(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})

	t.Run("returns sorted flags with featuremgmt.read", func(t *testing.T) {
		u := authedUserWithPermissions(1, 1, []accesscontrol.Permission{{Action: accesscontrol.ActionFeatureManagementRead}})
		req := webtest.RequestWithSignedInUser(server.NewGetRequest("/api/featuremgmt/labs-flags"), u)
		res, err := server.Send(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)
		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		require.NoError(t, res.Body.Close())

		var payload struct {
			Flags []struct {
				Name    string `json:"name"`
				Enabled bool   `json:"enabled"`
				Stage   string `json:"stage"`
			} `json:"flags"`
		}
		require.NoError(t, json.Unmarshal(body, &payload))
		require.Greater(t, len(payload.Flags), 10)

		for i := 1; i < len(payload.Flags); i++ {
			assert.LessOrEqual(t, payload.Flags[i-1].Name, payload.Flags[i].Name)
		}
	})
}
