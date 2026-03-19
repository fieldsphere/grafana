package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
	featuretoggleapi "github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
	"github.com/grafana/grafana/pkg/setting"
)

func TestIntegrationHTTPServer_GetFeatureToggles(t *testing.T) {
	cfg := setting.NewCfg()
	features := featuremgmt.WithFeatures(
		featuremgmt.FlagPanelTitleSearch, true,
		featuremgmt.FlagStorage, false,
	)

	m, hs := setupTestEnvironment(t, cfg, features, nil, nil, nil)
	m.Get("/api/admin/feature-toggles", hs.GetFeatureToggles)

	recorder := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/admin/feature-toggles", nil)
	m.ServeHTTP(recorder, req)

	require.Equal(t, http.StatusOK, recorder.Code)

	var response featuretoggleapi.ResolvedToggleState
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &response))

	toggles := map[string]featuretoggleapi.ToggleStatus{}
	for _, toggle := range response.Toggles {
		toggles[toggle.Name] = toggle
	}

	assert.True(t, response.Enabled[featuremgmt.FlagPanelTitleSearch])
	assert.False(t, response.Enabled[featuremgmt.FlagStorage])

	assert.True(t, toggles[featuremgmt.FlagPanelTitleSearch].Enabled)
	assert.Equal(t, "experimental", toggles[featuremgmt.FlagPanelTitleSearch].Stage)
	assert.NotEmpty(t, toggles[featuremgmt.FlagPanelTitleSearch].Description)

	assert.False(t, toggles[featuremgmt.FlagStorage].Enabled)
	assert.Equal(t, "experimental", toggles[featuremgmt.FlagStorage].Stage)
	assert.NotEmpty(t, toggles[featuremgmt.FlagStorage].Description)
}
