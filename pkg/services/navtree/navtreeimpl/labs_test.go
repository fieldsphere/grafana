package navtreeimpl

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/plugins"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/accesscontrol/acimpl"
	accesscontrolmock "github.com/grafana/grafana/pkg/services/accesscontrol/mock"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/navtree"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginaccesscontrol"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginsettings"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginstore"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestBuildLabsNavLink(t *testing.T) {
	cfg := setting.NewCfg()

	t.Run("returns nil when user is not signed in", func(t *testing.T) {
		httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
		reqCtx := &contextmodel.ReqContext{Context: &web.Context{Req: httpReq}}
		s := ServiceImpl{cfg: cfg, accessControl: acimpl.ProvideAccessControl(featuremgmt.WithFeatures())}
		require.Nil(t, s.buildLabsNavLink(reqCtx))
	})

	t.Run("returns nil without featuremgmt.read", func(t *testing.T) {
		httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
		reqCtx := &contextmodel.ReqContext{
			IsSignedIn:   true,
			SignedInUser: &user.SignedInUser{UserID: 1, OrgID: 1},
			Context:      &web.Context{Req: httpReq},
		}
		s := ServiceImpl{cfg: cfg, accessControl: acimpl.ProvideAccessControl(featuremgmt.WithFeatures())}
		require.Nil(t, s.buildLabsNavLink(reqCtx))
	})

	t.Run("returns Labs section with child when user has featuremgmt.read", func(t *testing.T) {
		httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
		reqCtx := &contextmodel.ReqContext{
			IsSignedIn: true,
			SignedInUser: &user.SignedInUser{
				UserID:      1,
				OrgID:       1,
				OrgRole:     org.RoleAdmin,
				Permissions: map[int64]map[string][]string{1: {ac.ActionFeatureManagementRead: {"*"}}},
			},
			Context: &web.Context{Req: httpReq},
		}
		s := ServiceImpl{cfg: cfg, accessControl: acimpl.ProvideAccessControl(featuremgmt.WithFeatures())}
		link := s.buildLabsNavLink(reqCtx)
		require.NotNil(t, link)
		require.Equal(t, navtree.NavIDLabs, link.Id)
		require.Equal(t, "Labs", link.Text)
		require.True(t, link.IsNew)
		require.Equal(t, int64(navtree.WeightLabs), link.SortWeight)
		require.Len(t, link.Children, 1)
		require.Equal(t, "labs-feature-flags", link.Children[0].Id)
		require.Equal(t, "/labs/feature-flags", link.Children[0].Url)
	})
}

func TestAddAppLinks_LabsSection(t *testing.T) {
	httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
	reqCtx := &contextmodel.ReqContext{
		IsSignedIn: true,
		SignedInUser: &user.SignedInUser{
			UserID:         1,
			OrgID:          1,
			OrgRole:        org.RoleAdmin,
			IsGrafanaAdmin: true,
			Permissions: map[int64]map[string][]string{
				1: {
					ac.ActionFeatureManagementRead:      {"*"},
					pluginaccesscontrol.ActionAppAccess: {pluginaccesscontrol.ScopeProvider.GetResourceScope("test-app1")},
				},
			},
		},
		Context: &web.Context{Req: httpReq},
	}

	testApp1 := pluginstore.Plugin{
		JSONData: plugins.JSONData{
			ID:   "test-app1",
			Name: "Test app1 name",
			Type: plugins.TypeApp,
			Includes: []*plugins.Includes{
				{
					Name:       "Catalog",
					Path:       "/a/test-app1/catalog",
					Type:       "page",
					AddToNav:   true,
					DefaultNav: true,
				},
				{
					Name:     "Page2",
					Path:     "/a/test-app1/page2",
					Type:     "page",
					AddToNav: true,
				},
			},
		},
	}

	permissions := []ac.Permission{
		{Action: pluginaccesscontrol.ActionAppAccess, Scope: pluginaccesscontrol.ScopeProvider.GetResourceScope("test-app1")},
		{Action: ac.ActionFeatureManagementRead, Scope: "*"},
	}

	t.Run("merges app into existing Labs node", func(t *testing.T) {
		service := ServiceImpl{
			log:           log.New("navtree"),
			cfg:           setting.NewCfg(),
			accessControl: accesscontrolmock.New().WithPermissions(permissions),
			pluginSettings: &pluginsettings.FakePluginSettings{
				Plugins: map[string]*pluginsettings.DTO{
					testApp1.ID: {ID: 0, OrgID: 1, PluginID: testApp1.ID, PluginVersion: "1.0.0", Enabled: true},
				},
			},
			features:    featuremgmt.WithFeatures(),
			pluginStore: &pluginstore.FakePluginStore{PluginList: []pluginstore.Plugin{testApp1}},
		}
		service.readNavigationSettings()
		service.navigationAppConfig["test-app1"] = NavigationAppConfig{SectionID: navtree.NavIDLabs}

		treeRoot := navtree.NavTreeRoot{}
		labs := service.buildLabsNavLink(reqCtx)
		require.NotNil(t, labs)
		treeRoot.AddSection(labs)

		err := service.addAppLinks(&treeRoot, reqCtx)
		require.NoError(t, err)

		labsNode := treeRoot.FindById(navtree.NavIDLabs)
		require.NotNil(t, labsNode)
		require.GreaterOrEqual(t, len(labsNode.Children), 2)
	})

	t.Run("creates Labs section when app targets labs but core Labs nav was absent", func(t *testing.T) {
		service := ServiceImpl{
			log:           log.New("navtree"),
			cfg:           setting.NewCfg(),
			accessControl: accesscontrolmock.New().WithPermissions(permissions),
			pluginSettings: &pluginsettings.FakePluginSettings{
				Plugins: map[string]*pluginsettings.DTO{
					testApp1.ID: {ID: 0, OrgID: 1, PluginID: testApp1.ID, PluginVersion: "1.0.0", Enabled: true},
				},
			},
			features:    featuremgmt.WithFeatures(),
			pluginStore: &pluginstore.FakePluginStore{PluginList: []pluginstore.Plugin{testApp1}},
		}
		service.readNavigationSettings()
		service.navigationAppConfig["test-app1"] = NavigationAppConfig{SectionID: navtree.NavIDLabs}

		treeRoot := navtree.NavTreeRoot{}
		err := service.addAppLinks(&treeRoot, reqCtx)
		require.NoError(t, err)

		labsNode := treeRoot.FindById(navtree.NavIDLabs)
		require.NotNil(t, labsNode)
		require.Len(t, labsNode.Children, 1)
		require.Equal(t, "plugin-page-test-app1", labsNode.Children[0].Id)
	})
}
