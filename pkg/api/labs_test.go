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
	"github.com/grafana/grafana/pkg/util/testutil"
)

func TestIntegrationHTTPServer_GetLabsFeatureToggles(t *testing.T) {
	testutil.SkipIntegrationTestInShortMode(t)

	cfg := setting.NewCfg()
	_, err := cfg.Raw.NewSection("feature_toggles")
	require.NoError(t, err)
	_, err = cfg.Raw.Section("feature_toggles").NewKey("customUnknownFlag", "true")
	require.NoError(t, err)

	m, hs := setupTestEnvironment(t, cfg, featuremgmt.WithFeatures("dashgpt", "customUnknownFlag"), nil, nil, nil)
	m.Get("/api/labs/feature-toggles", hs.GetLabsFeatureToggles)

	req := httptest.NewRequest(http.MethodGet, "/api/labs/feature-toggles", nil)
	recorder := httptest.NewRecorder()

	m.ServeHTTP(recorder, req)

	require.Equal(t, http.StatusOK, recorder.Code)

	var got featuretoggleapi.ResolvedToggleState
	err = json.Unmarshal(recorder.Body.Bytes(), &got)
	require.NoError(t, err)

	require.True(t, got.Enabled["dashgpt"])
	require.True(t, got.Enabled["customUnknownFlag"])

	var dashgpt *featuretoggleapi.ToggleStatus
	var customUnknown *featuretoggleapi.ToggleStatus
	for i := range got.Toggles {
		switch got.Toggles[i].Name {
		case "dashgpt":
			dashgpt = &got.Toggles[i]
		case "customUnknownFlag":
			customUnknown = &got.Toggles[i]
		}
	}

	require.NotNil(t, dashgpt)
	assert.Equal(t, "GA", dashgpt.Stage)
	assert.True(t, dashgpt.Enabled)
	assert.Equal(t, "Enable AI powered features in dashboards", dashgpt.Description)

	require.NotNil(t, customUnknown)
	assert.True(t, customUnknown.Enabled)
	assert.Equal(t, "Unknown flag configured in [feature_toggles]", customUnknown.Warning)
}
