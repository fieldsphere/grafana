package api

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	featuretoggleapi "github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestHTTPServerGetFeatureToggles(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Features = featuremgmt.WithManager("disabledFlag", false, "enabledFlag", true)
	})

	req := webtest.RequestWithSignedInUser(
		server.NewGetRequest("/api/featuremgmt"),
		userWithPermissions(1, []ac.Permission{{Action: ac.ActionFeatureManagementRead}}),
	)
	resp, err := server.Send(req)
	require.NoError(t, err)
	defer func() {
		require.NoError(t, resp.Body.Close())
	}()

	require.Equal(t, http.StatusOK, resp.StatusCode)

	var state featuretoggleapi.ResolvedToggleState
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&state))
	require.False(t, state.AllowEditing)
	require.Equal(t, map[string]bool{"enabledFlag": true}, state.Enabled)
	require.Len(t, state.Toggles, 2)
	require.Equal(t, "disabledFlag", state.Toggles[0].Name)
	require.False(t, state.Toggles[0].Enabled)
	require.Equal(t, "enabledFlag", state.Toggles[1].Name)
	require.True(t, state.Toggles[1].Enabled)
}
