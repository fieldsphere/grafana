package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"

	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

// nonManagerFeatureToggles implements featuremgmt.FeatureToggles without being a *FeatureManager.
type nonManagerFeatureToggles struct{}

func (nonManagerFeatureToggles) IsEnabled(_ context.Context, _ string) bool { return false }

func (nonManagerFeatureToggles) IsEnabledGlobally(_ string) bool { return false }

func (nonManagerFeatureToggles) GetEnabled(_ context.Context) map[string]bool { return nil }

func TestHTTPServer_GetFeatureFlagsRegistry(t *testing.T) {
	cfg := setting.NewCfg()
	fm, err := featuremgmt.ProvideManagerService(cfg)
	require.NoError(t, err)

	hs := &HTTPServer{Cfg: cfg, Features: fm}
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	c := &contextmodel.ReqContext{
		Context:      &web.Context{Req: req},
		SignedInUser: &user.SignedInUser{},
	}

	resp := hs.GetFeatureFlagsRegistry(c)
	body := string(resp.Body())

	require.Equal(t, http.StatusOK, resp.Status())
	require.Contains(t, body, `"name":"panelTitleSearch"`)
	require.NotContains(t, body, `"name":"publicDashboardsEmailSharing"`)
	require.NotContains(t, body, `"name":"liveAPIServer"`)
}

func TestHTTPServer_GetFeatureFlagsRegistry_grafanaAdminIncludesHiddenFlags(t *testing.T) {
	cfg := setting.NewCfg()
	fm, err := featuremgmt.ProvideManagerService(cfg)
	require.NoError(t, err)

	hs := &HTTPServer{Cfg: cfg, Features: fm}
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	c := &contextmodel.ReqContext{
		Context:      &web.Context{Req: req},
		SignedInUser: &user.SignedInUser{IsGrafanaAdmin: true},
	}

	resp := hs.GetFeatureFlagsRegistry(c)
	body := string(resp.Body())

	require.Equal(t, http.StatusOK, resp.Status())
	require.Contains(t, body, `"name":"publicDashboardsEmailSharing"`)
	require.Contains(t, body, `"name":"liveAPIServer"`)
}

func TestHTTPServer_GetFeatureFlagsRegistry_wrongFeatureTogglesType(t *testing.T) {
	cfg := setting.NewCfg()
	hs := &HTTPServer{Cfg: cfg, Features: nonManagerFeatureToggles{}}
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	c := &contextmodel.ReqContext{
		Context: &web.Context{Req: req},
	}

	resp := hs.GetFeatureFlagsRegistry(c)
	require.Equal(t, http.StatusInternalServerError, resp.Status())
}
