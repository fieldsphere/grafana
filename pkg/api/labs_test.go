package api

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/accesscontrol/acimpl"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestGetLabsFeatureToggles(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.AccessControl = acimpl.ProvideAccessControl(featuremgmt.WithFeatures())
		hs.Features = featuremgmt.WithFeatures(featuremgmt.FlagPanelTitleSearch)
	})

	t.Run("requires feature management read permission", func(t *testing.T) {
		req := server.NewGetRequest("/api/labs/feature-toggles")
		webtest.RequestWithSignedInUser(req, &user.SignedInUser{UserID: 1, OrgID: 1})

		resp, err := server.Send(req)
		require.NoError(t, err)
		require.Equal(t, http.StatusForbidden, resp.StatusCode)
		require.NoError(t, resp.Body.Close())
	})

	t.Run("returns feature toggle catalog with enabled state", func(t *testing.T) {
		req := server.NewGetRequest("/api/labs/feature-toggles")
		webtest.RequestWithSignedInUser(req, authedUserWithPermissions(1, 1, []ac.Permission{
			{Action: ac.ActionFeatureManagementRead},
		}))

		resp, err := server.Send(req)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var payload labsFeatureTogglesResponse
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&payload))
		require.NoError(t, resp.Body.Close())
		require.NotEmpty(t, payload.Toggles)

		var toggle *labsFeatureToggleDTO
		for i := range payload.Toggles {
			if payload.Toggles[i].Name == featuremgmt.FlagPanelTitleSearch {
				toggle = &payload.Toggles[i]
				break
			}
		}

		require.NotNil(t, toggle)
		require.True(t, toggle.Enabled)
		require.NotEmpty(t, toggle.Description)
		require.NotEmpty(t, toggle.Stage)
	})
}
