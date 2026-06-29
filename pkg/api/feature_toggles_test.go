package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"

	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestGetFeatureToggles(t *testing.T) {
	manager := featuremgmt.WithManager("alpha", true, "beta", false)
	server := setupSimpleHTTPServer(manager)
	responseWriter := web.NewResponseWriter(http.MethodGet, httptest.NewRecorder())
	request := httptest.NewRequest(http.MethodGet, "/api/feature-toggles", nil)
	ctx := &contextmodel.ReqContext{
		Context: &web.Context{Req: request, Resp: responseWriter},
	}

	resp := server.GetFeatureToggles(ctx)
	require.Equal(t, http.StatusOK, resp.Status())

	var body []map[string]any
	require.NoError(t, json.Unmarshal(resp.Body(), &body))
	require.Len(t, body, 2)
	require.Equal(t, "alpha", body[0]["name"])
	require.Equal(t, true, body[0]["enabled"])
	require.Equal(t, "beta", body[1]["name"])
	require.Equal(t, false, body[1]["enabled"])
}

func TestUpdateFeatureToggle(t *testing.T) {
	manager := featuremgmt.WithManager("alpha", true, "beta", false)
	server := setupSimpleHTTPServer(manager)

	request := httptest.NewRequest(http.MethodPut, "/api/feature-toggles/beta", strings.NewReader(`{"enabled":true}`))
	request = web.SetURLParams(request, map[string]string{":name": "beta"})
	request.Header.Set("Content-Type", "application/json")
	responseWriter := web.NewResponseWriter(http.MethodPut, httptest.NewRecorder())
	ctx := &contextmodel.ReqContext{
		Context: &web.Context{Req: request, Resp: responseWriter},
	}

	resp := server.UpdateFeatureToggle(ctx)
	require.Equal(t, http.StatusOK, resp.Status())
	require.True(t, manager.IsEnabledGlobally("beta"))

	var body updateFeatureToggleResponse
	require.NoError(t, json.Unmarshal(resp.Body(), &body))
	require.Equal(t, updateFeatureToggleResponse{Name: "beta", Enabled: true}, body)
}

func TestUpdateFeatureToggleReturnsActualEnabledState(t *testing.T) {
	cfg := setting.NewCfg()
	cfg.Env = setting.Prod
	manager, err := featuremgmt.ProvideManagerService(cfg)
	require.NoError(t, err)
	server := setupSimpleHTTPServer(manager)

	request := httptest.NewRequest(http.MethodPut, "/api/feature-toggles/liveAPIServer", strings.NewReader(`{"enabled":true}`))
	request = web.SetURLParams(request, map[string]string{":name": "liveAPIServer"})
	request.Header.Set("Content-Type", "application/json")
	responseWriter := web.NewResponseWriter(http.MethodPut, httptest.NewRecorder())
	ctx := &contextmodel.ReqContext{
		Context: &web.Context{Req: request, Resp: responseWriter},
	}

	resp := server.UpdateFeatureToggle(ctx)
	require.Equal(t, http.StatusOK, resp.Status())
	require.False(t, manager.IsEnabledGlobally("liveAPIServer"))

	var body updateFeatureToggleResponse
	require.NoError(t, json.Unmarshal(resp.Body(), &body))
	require.Equal(t, updateFeatureToggleResponse{Name: "liveAPIServer", Enabled: false}, body)
}

func TestUpdateFeatureToggleNotFound(t *testing.T) {
	manager := featuremgmt.WithManager("alpha", true)
	server := setupSimpleHTTPServer(manager)

	request := httptest.NewRequest(http.MethodPut, "/api/feature-toggles/missing", strings.NewReader(`{"enabled":true}`))
	request = web.SetURLParams(request, map[string]string{":name": "missing"})
	request.Header.Set("Content-Type", "application/json")
	responseWriter := web.NewResponseWriter(http.MethodPut, httptest.NewRecorder())
	ctx := &contextmodel.ReqContext{
		Context: &web.Context{Req: request, Resp: responseWriter},
	}

	resp := server.UpdateFeatureToggle(ctx)
	require.Equal(t, http.StatusNotFound, resp.Status())
}
