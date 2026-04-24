package navtreeimpl

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	claims "github.com/grafana/authlib/types"
	"github.com/grafana/grafana/pkg/infra/log"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	accesscontrolmock "github.com/grafana/grafana/pkg/services/accesscontrol/mock"
	"github.com/grafana/grafana/pkg/services/authn"
	"github.com/grafana/grafana/pkg/services/authn/authntest"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/licensing"
	"github.com/grafana/grafana/pkg/services/navtree"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginsettings"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginstore"
	pref "github.com/grafana/grafana/pkg/services/preference"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestGetNavTreeLabsSection(t *testing.T) {
	newReqContext := func() *contextmodel.ReqContext {
		httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
		return &contextmodel.ReqContext{
			SignedInUser: &user.SignedInUser{
				OrgID:       1,
				OrgRole:     org.RoleViewer,
				Login:       "admin",
				Name:        "Admin",
				Permissions: map[int64]map[string][]string{},
			},
			IsSignedIn: true,
			Context: &web.Context{
				Req:    httpReq,
				Logger: log.NewNopLogger(),
			},
		}
	}

	newService := func(permissions []ac.Permission) *ServiceImpl {
		return &ServiceImpl{
			cfg:           &setting.Cfg{AppSubURL: ""},
			log:           log.New("navtree-test"),
			accessControl: accesscontrolmock.New().WithPermissions(permissions),
			authnService: &authntest.FakeService{
				ExpectedIdentity: &authn.Identity{
					ID:          "user:1",
					Type:        claims.TypeUser,
					Permissions: map[int64]map[string][]string{},
				},
			},
			pluginSettings: &pluginsettings.FakePluginSettings{},
			pluginStore:    &pluginstore.FakePluginStore{},
			license:        &licensing.OSSLicensingService{},
			features:       featuremgmt.WithFeatures(),
		}
	}

	t.Run("adds labs section when user can read settings", func(t *testing.T) {
		service := newService([]ac.Permission{
			{Action: ac.ActionSettingsRead, Scope: ac.ScopeSettingsAll},
		})

		treeRoot, err := service.GetNavTree(newReqContext(), &pref.Preference{})
		require.NoError(t, err)

		labs := treeRoot.FindById(navtree.NavIDLabs)
		require.NotNil(t, labs)
		require.Equal(t, "/labs", labs.Url)
		require.Len(t, labs.Children, 1)
		require.Equal(t, "labs/feature-flags", labs.Children[0].Id)
		require.Equal(t, "/labs/feature-flags", labs.Children[0].Url)
	})

	t.Run("does not add labs section when settings read is missing", func(t *testing.T) {
		service := newService(nil)

		treeRoot, err := service.GetNavTree(newReqContext(), &pref.Preference{})
		require.NoError(t, err)
		require.Nil(t, treeRoot.FindById(navtree.NavIDLabs))
	})
}
