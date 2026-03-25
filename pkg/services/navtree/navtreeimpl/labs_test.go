package navtreeimpl

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/accesscontrol/acimpl"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/navtree"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestBuildLabsNavLink(t *testing.T) {
	httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
	cfg := setting.NewCfg()

	t.Run("returns nil without featuremgmt.read", func(t *testing.T) {
		reqCtx := &contextmodel.ReqContext{
			SignedInUser: &user.SignedInUser{
				UserID: 1,
				OrgID:  1,
				Permissions: map[int64]map[string][]string{
					1: {},
				},
			},
			Context: &web.Context{Req: httpReq},
		}
		s := &ServiceImpl{
			cfg:           cfg,
			accessControl: acimpl.ProvideAccessControl(featuremgmt.WithFeatures()),
		}
		require.Nil(t, s.buildLabsNavLink(reqCtx))
	})

	t.Run("returns Labs nav with IsNew when user has featuremgmt.read", func(t *testing.T) {
		reqCtx := &contextmodel.ReqContext{
			SignedInUser: &user.SignedInUser{
				UserID: 1,
				OrgID:  1,
				Permissions: map[int64]map[string][]string{
					1: {
						ac.ActionFeatureManagementRead: {ac.ScopeSettingsAll},
					},
				},
			},
			Context: &web.Context{Req: httpReq},
		}
		s := &ServiceImpl{
			cfg:           cfg,
			accessControl: acimpl.ProvideAccessControl(featuremgmt.WithFeatures()),
		}
		link := s.buildLabsNavLink(reqCtx)
		require.NotNil(t, link)
		require.Equal(t, navtree.NavIDLabs, link.Id)
		require.Equal(t, "Labs", link.Text)
		require.True(t, link.IsNew)
		require.Equal(t, int64(navtree.WeightLabs), link.SortWeight)
		require.Contains(t, link.Url, "/labs")
	})
}
