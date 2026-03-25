package api

import (
	"encoding/json"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/accesscontrol/actest"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestHTTPServer_GetFeatureFlags(t *testing.T) {
	t.Run("returns 403 when not authorized", func(t *testing.T) {
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.AccessControl = &actest.FakeAccessControl{ExpectedEvaluate: false}
		})

		res, err := server.Send(webtest.RequestWithSignedInUser(server.NewGetRequest("/api/featuremgmt/flags"), &user.SignedInUser{
			UserID: 1,
			OrgID:  1,
		}))
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})

	t.Run("returns 200 with flags when authorized", func(t *testing.T) {
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.AccessControl = &actest.FakeAccessControl{ExpectedEvaluate: true}
			// Empty WithFeatures() has no registered flags; use at least one for a non-empty list.
			hs.Features = featuremgmt.WithFeatures("labsTestFlag")
		})

		res, err := server.Send(webtest.RequestWithSignedInUser(server.NewGetRequest("/api/featuremgmt/flags"), &user.SignedInUser{
			UserID: 1,
			OrgID:  1,
		}))
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)

		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		require.NoError(t, res.Body.Close())

		var flags []featuremgmt.FeatureFlagState
		require.NoError(t, json.Unmarshal(body, &flags))
		require.Len(t, flags, 1)
		require.Equal(t, "labsTestFlag", flags[0].Name)
		require.True(t, flags[0].Enabled)
	})
}
