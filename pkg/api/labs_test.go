package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestHTTPServer_GetLabsFeatureToggles(t *testing.T) {
	t.Parallel()

	cfg := setting.NewCfg()
	fm, err := featuremgmt.ProvideManagerService(cfg)
	require.NoError(t, err)

	hs := setupSimpleHTTPServer(fm)

	t.Run("returns sorted feature flags with metadata", func(t *testing.T) {
		resp := hs.GetLabsFeatureToggles(signedInReqContext(t))
		assert.Equal(t, http.StatusOK, resp.Status())
		var rows []labsFeatureFlagDTO
		err := json.Unmarshal(resp.Body(), &rows)
		require.NoError(t, err)
		assert.Greater(t, len(rows), 10)
		for i := 1; i < len(rows); i++ {
			assert.LessOrEqual(t, rows[i-1].Name, rows[i].Name)
		}
	})

	t.Run("does not return feature flags hidden from docs", func(t *testing.T) {
		resp := hs.GetLabsFeatureToggles(signedInReqContext(t))
		assert.Equal(t, http.StatusOK, resp.Status())

		var rows []labsFeatureFlagDTO
		err := json.Unmarshal(resp.Body(), &rows)
		require.NoError(t, err)

		hiddenFlags := make(map[string]struct{})
		for _, flag := range fm.GetFlags() {
			if flag.HideFromDocs {
				hiddenFlags[flag.Name] = struct{}{}
			}
		}
		require.NotEmpty(t, hiddenFlags)

		for _, row := range rows {
			_, hidden := hiddenFlags[row.Name]
			assert.Falsef(t, hidden, "expected hidden feature flag %q to be omitted", row.Name)
		}
	})
}

func signedInReqContext(t *testing.T) *contextmodel.ReqContext {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/api/labs/feature-toggles", nil)
	return &contextmodel.ReqContext{
		IsSignedIn: true,
		Context: &web.Context{
			Req: req,
		},
	}
}
