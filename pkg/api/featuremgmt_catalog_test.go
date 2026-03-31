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

func TestAPI_GetFeatureFlagCatalog(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Cfg = setting.NewCfg()
		hs.Features = featuremgmt.WithFeatures([]any{"catalogTestFlag", true, "catalogOffFlag", false}...)
	})

	url := "/api/featuremgmt/toggles"

	t.Run("forbidden without permission", func(t *testing.T) {
		req := webtest.RequestWithSignedInUser(server.NewGetRequest(url), userWithPermissions(1, []accesscontrol.Permission{{Action: "orgs:invalid"}}))
		res, err := server.Send(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})

	t.Run("ok with featuremgmt read", func(t *testing.T) {
		req := webtest.RequestWithSignedInUser(
			server.NewGetRequest(url),
			userWithPermissions(1, []accesscontrol.Permission{{Action: accesscontrol.ActionFeatureManagementRead}}),
		)
		res, err := server.Send(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)
		b, readErr := io.ReadAll(res.Body)
		require.NoError(t, readErr)
		require.NoError(t, res.Body.Close())

		var payload struct {
			FeatureFlags []struct {
				Name    string `json:"name"`
				Enabled bool   `json:"enabled"`
			} `json:"featureFlags"`
		}
		require.NoError(t, json.Unmarshal(b, &payload))

		byName := make(map[string]bool, len(payload.FeatureFlags))
		for _, f := range payload.FeatureFlags {
			byName[f.Name] = f.Enabled
		}
		assert.True(t, byName["catalogTestFlag"])
		assert.False(t, byName["catalogOffFlag"])
	})
}
