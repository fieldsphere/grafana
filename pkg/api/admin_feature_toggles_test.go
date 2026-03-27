package api

import (
	"encoding/json"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestAPI_AdminGetFeatureToggles(t *testing.T) {
	t.Run("returns 401 when not signed in", func(t *testing.T) {
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = setting.NewCfg()
		})

		res, err := server.Send(server.NewGetRequest("/api/admin/feature-toggles"))
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})

	t.Run("returns 200 for viewer and sorted flag names", func(t *testing.T) {
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = setting.NewCfg()
			hs.Features = featuremgmt.WithFeatures("zebra", true, "alpha", false)
		})

		res, err := server.Send(webtest.RequestWithSignedInUser(
			server.NewGetRequest("/api/admin/feature-toggles"),
			authedUserWithPermissions(1, 1, nil),
		))
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)

		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		require.NoError(t, res.Body.Close())

		var parsed FeatureToggleListResponse
		require.NoError(t, json.Unmarshal(body, &parsed))
		require.Len(t, parsed.Flags, 2)
		assert.Equal(t, "alpha", parsed.Flags[0].Name)
		assert.False(t, parsed.Flags[0].Enabled)
		assert.Equal(t, "zebra", parsed.Flags[1].Name)
		assert.True(t, parsed.Flags[1].Enabled)
	})
}
