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
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestAPI_GetFeatureToggles(t *testing.T) {
	t.Run("signed-in user gets 200 with toggles list", func(t *testing.T) {
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Features = featuremgmt.WithManager("alpha", true, "beta", false)
		})

		res, err := server.Send(
			webtest.RequestWithSignedInUser(
				server.NewGetRequest("/api/feature-toggles"),
				userWithPermissions(1, []accesscontrol.Permission{}),
			),
		)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)

		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		require.NoError(t, res.Body.Close())

		var parsed FeatureToggleListResponse
		require.NoError(t, json.Unmarshal(body, &parsed))
		require.Len(t, parsed.Toggles, 2)
		assert.Equal(t, "alpha", parsed.Toggles[0].Name)
		assert.True(t, parsed.Toggles[0].Enabled)
		assert.Equal(t, "beta", parsed.Toggles[1].Name)
		assert.False(t, parsed.Toggles[1].Enabled)
	})

	t.Run("unsigned request gets 401", func(t *testing.T) {
		server := SetupAPITestServer(t)

		res, err := server.Send(server.NewGetRequest("/api/feature-toggles"))
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})
}
