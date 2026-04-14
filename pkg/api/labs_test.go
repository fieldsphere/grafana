package api

import (
	"encoding/json"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestGetFeatureFlags(t *testing.T) {
	featureManager := featuremgmt.WithManager("testFeature", true, "disabledFeature", false)

	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.featureManager = featureManager
		hs.Features = featureManager
	})

	req := server.NewGetRequest("/api/featureflags")
	req = webtest.RequestWithSignedInUser(req, &user.SignedInUser{UserID: 1, OrgID: 1, OrgRole: org.RoleViewer, IsAnonymous: false})

	res, err := server.Send(req)
	require.NoError(t, err)
	defer func() { _ = res.Body.Close() }()

	assert.Equal(t, http.StatusOK, res.StatusCode)

	body, err := io.ReadAll(res.Body)
	require.NoError(t, err)

	var flags []FeatureFlagDTO
	err = json.Unmarshal(body, &flags)
	require.NoError(t, err)

	// Verify we got some flags back (test flags)
	assert.Greater(t, len(flags), 0)

	// Verify flags are sorted by name
	for i := 1; i < len(flags); i++ {
		assert.LessOrEqual(t, flags[i-1].Name, flags[i].Name)
	}

	// Check that we have the test feature in the results
	var foundTestFeature, foundDisabledFeature bool
	for _, f := range flags {
		if f.Name == "testFeature" {
			foundTestFeature = true
			assert.True(t, f.Enabled, "testFeature should be enabled")
		}
		if f.Name == "disabledFeature" {
			foundDisabledFeature = true
			assert.False(t, f.Enabled, "disabledFeature should be disabled")
		}
	}
	assert.True(t, foundTestFeature, "testFeature should be in results")
	assert.True(t, foundDisabledFeature, "disabledFeature should be in results")
}

func TestGetFeatureFlagsUnauthorized(t *testing.T) {
	featureManager := featuremgmt.WithManager()

	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.featureManager = featureManager
		hs.Features = featureManager
	})

	// Request without signed in user
	req := server.NewGetRequest("/api/featureflags")

	res, err := server.Send(req)
	require.NoError(t, err)
	defer func() { _ = res.Body.Close() }()

	// Should be unauthorized since we didn't provide a signed in user
	assert.Equal(t, http.StatusUnauthorized, res.StatusCode)
}
