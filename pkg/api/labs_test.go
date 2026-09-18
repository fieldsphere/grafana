package api

import (
	"encoding/json"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestAPI_GetLabsFeatureToggles(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Features = featuremgmt.WithFeatures("adHocFilterDefaultValues", true)
	})

	res, err := server.Send(webtest.RequestWithSignedInUser(server.NewGetRequest("/api/labs/feature-toggles"), userWithPermissions(1, nil)))
	require.NoError(t, err)
	defer res.Body.Close()

	assert.Equal(t, http.StatusOK, res.StatusCode)

	body, err := io.ReadAll(res.Body)
	require.NoError(t, err)

	var toggles []LabsFeatureToggleDTO
	require.NoError(t, json.Unmarshal(body, &toggles))

	assert.NotEmpty(t, toggles)

	for _, toggle := range toggles {
		assert.True(t, isOpenFeatureStage(toggle.Stage), "expected open stage, got %q for %q", toggle.Stage, toggle.Name)
	}

	names := make([]string, len(toggles))
	for i, toggle := range toggles {
		names[i] = toggle.Name
	}
	for i := 1; i < len(names); i++ {
		assert.LessOrEqual(t, names[i-1], names[i])
	}

	enabledByName := make(map[string]bool, len(toggles))
	for _, toggle := range toggles {
		enabledByName[toggle.Name] = toggle.Enabled
	}

	assert.True(t, enabledByName["adHocFilterDefaultValues"])
}

func TestAPI_GetLabsFeatureToggles_Unauthorized(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {})

	res, err := server.Send(server.NewGetRequest("/api/labs/feature-toggles"))
	require.NoError(t, err)
	defer res.Body.Close()

	assert.Equal(t, http.StatusUnauthorized, res.StatusCode)
}

func TestIsOpenFeatureStage(t *testing.T) {
	tests := []struct {
		stage string
		open  bool
	}{
		{stage: "experimental", open: true},
		{stage: "preview", open: true},
		{stage: "privatePreview", open: true},
		{stage: "GA", open: false},
		{stage: "deprecated", open: false},
		{stage: "unknown", open: false},
	}

	for _, tt := range tests {
		t.Run(tt.stage, func(t *testing.T) {
			assert.Equal(t, tt.open, isOpenFeatureStage(tt.stage))
		})
	}
}
