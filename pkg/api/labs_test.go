package api

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestAPIEndpoint_GetLabsFeatureToggles(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Features = featuremgmt.WithFeatures(featuremgmt.FlagPanelTitleSearch, "customIniOnlyFlag")
	})

	req := webtest.RequestWithSignedInUser(
		server.NewGetRequest("/api/labs/feature-toggles"),
		userWithPermissions(1, []accesscontrol.Permission{{Action: accesscontrol.ActionOrgsRead}}),
	)

	res, err := server.Send(req)
	require.NoError(t, err)
	defer func() { require.NoError(t, res.Body.Close()) }()

	assert.Equal(t, http.StatusOK, res.StatusCode)

	var body labsFeatureTogglesResponse
	require.NoError(t, json.NewDecoder(res.Body).Decode(&body))
	require.NotEmpty(t, body.Toggles)
	assert.Greater(t, body.AvailableCount, 0)
	assert.Equal(t, 1, body.ActiveCount)

	var panelTitleSearch *labsFeatureToggleDTO
	for i := range body.Toggles {
		if body.Toggles[i].Name == featuremgmt.FlagPanelTitleSearch {
			panelTitleSearch = &body.Toggles[i]
			break
		}
	}

	require.NotNil(t, panelTitleSearch)
	assert.True(t, panelTitleSearch.Enabled)
	assert.Equal(t, "Search for dashboards using panel title", panelTitleSearch.Description)
	assert.Equal(t, "preview", panelTitleSearch.Stage)
}
