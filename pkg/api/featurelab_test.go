package api

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestGetFeatureToggles(t *testing.T) {
	features := featuremgmt.WithManager("featureA", "featureB", "featureC", false)

	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Features = features
	})

	t.Run("returns feature flags for admin user", func(t *testing.T) {
		req := server.NewGetRequest("/api/featuremgmt/features")
		req = webtest.RequestWithSignedInUser(req, &user.SignedInUser{
			OrgID: 1,
			Permissions: map[int64]map[string][]string{
				1: {accesscontrol.ActionFeatureManagementRead: {}},
			},
		})
		resp, err := server.Send(req)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var flags []featureFlagDTO
		err = json.NewDecoder(resp.Body).Decode(&flags)
		require.NoError(t, err)
		require.NoError(t, resp.Body.Close())

		assert.Len(t, flags, 3)

		flagMap := make(map[string]featureFlagDTO)
		for _, f := range flags {
			flagMap[f.Name] = f
		}

		assert.True(t, flagMap["featureA"].Enabled)
		assert.True(t, flagMap["featureB"].Enabled)
		assert.False(t, flagMap["featureC"].Enabled)
	})

	t.Run("returns 403 for user without permission", func(t *testing.T) {
		req := server.NewGetRequest("/api/featuremgmt/features")
		req = webtest.RequestWithSignedInUser(req, &user.SignedInUser{
			OrgID:       1,
			Permissions: map[int64]map[string][]string{1: {}},
		})
		resp, err := server.Send(req)
		require.NoError(t, err)
		require.Equal(t, http.StatusForbidden, resp.StatusCode)
		require.NoError(t, resp.Body.Close())
	})
}

func TestUpdateFeatureToggle(t *testing.T) {
	features := featuremgmt.WithManager("featureA", "featureB")

	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Features = features
	})

	t.Run("toggles a feature flag", func(t *testing.T) {
		body := `{"enabled": false}`
		req := server.NewRequest(http.MethodPut, "/api/featuremgmt/features/featureA", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req = webtest.RequestWithSignedInUser(req, &user.SignedInUser{
			OrgID: 1,
			Permissions: map[int64]map[string][]string{
				1: {accesscontrol.ActionFeatureManagementWrite: {}},
			},
		})
		resp, err := server.Send(req)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)
		require.NoError(t, resp.Body.Close())

		assert.False(t, features.IsEnabledGlobally("featureA"))
	})

	t.Run("returns 404 for unknown feature flag", func(t *testing.T) {
		body := `{"enabled": true}`
		req := server.NewRequest(http.MethodPut, "/api/featuremgmt/features/nonexistent", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req = webtest.RequestWithSignedInUser(req, &user.SignedInUser{
			OrgID: 1,
			Permissions: map[int64]map[string][]string{
				1: {accesscontrol.ActionFeatureManagementWrite: {}},
			},
		})
		resp, err := server.Send(req)
		require.NoError(t, err)
		require.Equal(t, http.StatusNotFound, resp.StatusCode)
		require.NoError(t, resp.Body.Close())
	})

	t.Run("returns 403 for user without write permission", func(t *testing.T) {
		body := `{"enabled": true}`
		req := server.NewRequest(http.MethodPut, "/api/featuremgmt/features/featureA", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req = webtest.RequestWithSignedInUser(req, &user.SignedInUser{
			OrgID:       1,
			Permissions: map[int64]map[string][]string{1: {}},
		})
		resp, err := server.Send(req)
		require.NoError(t, err)
		require.Equal(t, http.StatusForbidden, resp.StatusCode)
		require.NoError(t, resp.Body.Close())
	})
}
