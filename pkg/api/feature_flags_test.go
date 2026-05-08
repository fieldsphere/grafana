package api

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestHTTPServer_GetFeatureFlagsCatalog(t *testing.T) {
	cfg := setting.NewCfg()
	mgmt, err := featuremgmt.ProvideManagerService(cfg)
	require.NoError(t, err)

	hs := &HTTPServer{Features: mgmt}

	httpReq, err := http.NewRequest(http.MethodGet, "", nil)
	require.NoError(t, err)
	reqCtx := &contextmodel.ReqContext{
		SignedInUser: &user.SignedInUser{UserID: 1, OrgID: 1, OrgRole: org.RoleViewer},
		Context:      &web.Context{Req: httpReq},
	}

	res := hs.GetFeatureFlagsCatalog(reqCtx)
	nr, ok := res.(*response.NormalResponse)
	require.True(t, ok)
	require.Equal(t, http.StatusOK, nr.Status())

	var payload dtos.FeatureFlagCatalogDTO
	err = json.Unmarshal(nr.Body(), &payload)
	require.NoError(t, err)
	require.NotEmpty(t, payload.Flags)
}

func TestHTTPServer_GetFeatureFlagsCatalog_MockFallback(t *testing.T) {
	hs := &HTTPServer{Features: stubFeatureToggles{}}

	httpReq, err := http.NewRequest(http.MethodGet, "", nil)
	require.NoError(t, err)
	reqCtx := &contextmodel.ReqContext{
		SignedInUser: &user.SignedInUser{UserID: 1, OrgID: 1, OrgRole: org.RoleViewer},
		Context:      &web.Context{Req: httpReq},
	}

	res := hs.GetFeatureFlagsCatalog(reqCtx)
	nr, ok := res.(*response.NormalResponse)
	require.True(t, ok)
	require.Equal(t, http.StatusOK, nr.Status())

	var payload dtos.FeatureFlagCatalogDTO
	err = json.Unmarshal(nr.Body(), &payload)
	require.NoError(t, err)
	require.Len(t, payload.Flags, 1)
	require.Equal(t, "panelTitleSearch", payload.Flags[0].Name)
	require.True(t, payload.Flags[0].Enabled)
}

// stubFeatureToggles implements featuremgmt.FeatureToggles without exposing *FeatureManager (fallback path in handler).
type stubFeatureToggles struct{}

func (stubFeatureToggles) IsEnabled(context.Context, string) bool { return false }

func (stubFeatureToggles) IsEnabledGlobally(string) bool { return false }

func (stubFeatureToggles) GetEnabled(context.Context) map[string]bool {
	return map[string]bool{"panelTitleSearch": true}
}
