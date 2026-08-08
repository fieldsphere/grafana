package api

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web"
)

func TestHTTPServer_GetLabsFeatureToggles(t *testing.T) {
	t.Run("returns feature toggles sorted by name", func(t *testing.T) {
		features := featuremgmt.WithFeatures("betaFlag", "alphaFlag")
		hs := &HTTPServer{Features: features}

		httpReq, err := http.NewRequest(http.MethodGet, "/api/labs/feature-toggles", nil)
		require.NoError(t, err)

		sc := setupScenarioContext(t, "/api/labs/feature-toggles")
		sc.context = &contextmodel.ReqContext{
			Context:      &web.Context{Req: httpReq},
			SignedInUser: &user.SignedInUser{UserID: 1, OrgID: 1},
		}

		resp := hs.GetLabsFeatureToggles(sc.context)
		require.Equal(t, http.StatusOK, resp.Status())

		var toggles []labsFeatureToggleDTO
		err = json.Unmarshal(resp.Body(), &toggles)
		require.NoError(t, err)
		require.Len(t, toggles, 2)
		require.Equal(t, "alphaFlag", toggles[0].Name)
		require.Equal(t, "betaFlag", toggles[1].Name)
		require.True(t, toggles[0].Enabled)
		require.True(t, toggles[1].Enabled)
	})
}
