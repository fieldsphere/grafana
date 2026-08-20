package live

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/grafana/grafana-app-sdk/app"
	"github.com/stretchr/testify/require"
	"k8s.io/apiserver/pkg/authorization/authorizer"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/contexthandler/ctxkey"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	grafanalive "github.com/grafana/grafana/pkg/services/live"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestRegisterAppInstallerWiresTransportHandlers(t *testing.T) {
	cfg := setting.NewCfg()
	gl := &grafanalive.GrafanaLive{}

	installer, err := RegisterAppInstaller(cfg, featuremgmt.WithFeatures(), gl)
	require.NoError(t, err)
	require.NotNil(t, installer)
	require.NotNil(t, installer.AppInstaller)
}

func TestStreamIDFromRequest(t *testing.T) {
	require.Equal(t, "metrics", streamIDFromRequest(&app.CustomRouteRequest{Path: "push/metrics"}))
	require.Equal(t, "abc", streamIDFromRequest(&app.CustomRouteRequest{Path: "/push/abc/"}))
}

func TestHttpRequestFromCustomCopiesHost(t *testing.T) {
	t.Run("from URL", func(t *testing.T) {
		u, err := url.Parse("http://grafana.internal:3000/apis/live.grafana.app/v1alpha1/namespaces/default/ws")
		require.NoError(t, err)
		req := httpRequestFromCustom(context.Background(), &app.CustomRouteRequest{
			Method: http.MethodGet,
			URL:    u,
		})
		require.Equal(t, "grafana.internal:3000", req.Host)
	})

	t.Run("from Host header", func(t *testing.T) {
		u, err := url.Parse("/apis/live.grafana.app/v1alpha1/namespaces/default/ws")
		require.NoError(t, err)
		req := httpRequestFromCustom(context.Background(), &app.CustomRouteRequest{
			Method: http.MethodGet,
			URL:    u,
			Headers: http.Header{
				"Host": []string{"grafana.internal:3000"},
			},
		})
		require.Equal(t, "grafana.internal:3000", req.Host)
	})

	t.Run("from original Grafana request on context", func(t *testing.T) {
		orig := httptest.NewRequest(http.MethodGet, "/apis/live.grafana.app/v1alpha1/namespaces/default/ws", nil)
		orig.Host = "grafana.internal:3000"
		ctx := context.WithValue(context.Background(), ctxkey.Key{}, &contextmodel.ReqContext{
			Context: &web.Context{Req: orig},
		})
		req := httpRequestFromCustom(ctx, &app.CustomRouteRequest{
			Method:  http.MethodGet,
			URL:     orig.URL,
			Headers: orig.Header,
		})
		require.Equal(t, "grafana.internal:3000", req.Host)
	})
}

func TestPushGetHandlerRequiresOrgAdmin(t *testing.T) {
	handler := newPushGetHandler(&grafanalive.GrafanaLive{})

	t.Run("viewer is forbidden", func(t *testing.T) {
		rec := httptest.NewRecorder()
		ctx := identity.WithRequester(context.Background(), &identity.StaticRequester{OrgRole: identity.RoleViewer})
		err := handler(ctx, rec, &app.CustomRouteRequest{Path: "push/metrics"})
		require.NoError(t, err)
		require.Equal(t, http.StatusForbidden, rec.Code)
	})

	t.Run("editor is forbidden", func(t *testing.T) {
		rec := httptest.NewRecorder()
		ctx := identity.WithRequester(context.Background(), &identity.StaticRequester{OrgRole: identity.RoleEditor})
		err := handler(ctx, rec, &app.CustomRouteRequest{Path: "push/metrics"})
		require.NoError(t, err)
		require.Equal(t, http.StatusForbidden, rec.Code)
	})

	t.Run("unauthenticated is unauthorized", func(t *testing.T) {
		rec := httptest.NewRecorder()
		err := handler(context.Background(), rec, &app.CustomRouteRequest{Path: "push/metrics"})
		require.NoError(t, err)
		require.Equal(t, http.StatusUnauthorized, rec.Code)
	})
}

func TestPushPostHandlerRequiresLivePush(t *testing.T) {
	handler := newPushPostHandler(&grafanalive.GrafanaLive{})

	t.Run("viewer without live:push is forbidden", func(t *testing.T) {
		rec := httptest.NewRecorder()
		ctx := identity.WithRequester(context.Background(), &identity.StaticRequester{
			OrgID:   1,
			OrgRole: identity.RoleViewer,
		})
		err := handler(ctx, rec, &app.CustomRouteRequest{Path: "push/metrics"})
		require.NoError(t, err)
		require.Equal(t, http.StatusForbidden, rec.Code)
	})

	t.Run("unauthenticated is unauthorized", func(t *testing.T) {
		rec := httptest.NewRecorder()
		err := handler(context.Background(), rec, &app.CustomRouteRequest{Path: "push/metrics"})
		require.NoError(t, err)
		require.Equal(t, http.StatusUnauthorized, rec.Code)
	})
}

func TestGetAuthorizerPush(t *testing.T) {
	installer := &AppInstaller{}
	auth := installer.GetAuthorizer()

	viewer := &identity.StaticRequester{OrgID: 1, OrgRole: identity.RoleViewer}
	admin := &identity.StaticRequester{OrgID: 1, OrgRole: identity.RoleAdmin}
	editorWithPush := &identity.StaticRequester{
		OrgID:   1,
		OrgRole: identity.RoleEditor,
		Permissions: map[int64]map[string][]string{
			1: {accesscontrol.ActionLivePush: {}},
		},
	}
	editorWithoutPush := &identity.StaticRequester{OrgID: 1, OrgRole: identity.RoleEditor}

	t.Run("viewer cannot get push websocket", func(t *testing.T) {
		decision, _, err := auth.Authorize(identity.WithRequester(context.Background(), viewer), &mockAttributes{
			isResourceRequest: true,
			resource:          pushResource,
			verb:              "get",
		})
		require.NoError(t, err)
		require.Equal(t, authorizer.DecisionDeny, decision)
	})

	t.Run("org admin can get push websocket", func(t *testing.T) {
		decision, _, err := auth.Authorize(identity.WithRequester(context.Background(), admin), &mockAttributes{
			isResourceRequest: true,
			resource:          pushResource,
			verb:              "get",
		})
		require.NoError(t, err)
		require.Equal(t, authorizer.DecisionAllow, decision)
	})

	t.Run("editor without live:push cannot post", func(t *testing.T) {
		decision, _, err := auth.Authorize(identity.WithRequester(context.Background(), editorWithoutPush), &mockAttributes{
			isResourceRequest: true,
			resource:          pushResource,
			verb:              "create",
		})
		require.NoError(t, err)
		require.Equal(t, authorizer.DecisionDeny, decision)
	})

	t.Run("editor with live:push can post", func(t *testing.T) {
		decision, _, err := auth.Authorize(identity.WithRequester(context.Background(), editorWithPush), &mockAttributes{
			isResourceRequest: true,
			resource:          pushResource,
			verb:              "create",
		})
		require.NoError(t, err)
		require.Equal(t, authorizer.DecisionAllow, decision)
	})

	t.Run("ws remains available to authenticated viewers", func(t *testing.T) {
		decision, _, err := auth.Authorize(identity.WithRequester(context.Background(), viewer), &mockAttributes{
			isResourceRequest: true,
			resource:          "ws",
			verb:              "get",
		})
		require.NoError(t, err)
		require.Equal(t, authorizer.DecisionAllow, decision)
	})
}

type mockAttributes struct {
	authorizer.Attributes
	isResourceRequest bool
	resource          string
	verb              string
}

func (m *mockAttributes) IsResourceRequest() bool { return m.isResourceRequest }
func (m *mockAttributes) GetResource() string     { return m.resource }
func (m *mockAttributes) GetVerb() string         { return m.verb }
