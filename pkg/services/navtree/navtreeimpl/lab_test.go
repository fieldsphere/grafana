package navtreeimpl

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/navtree"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestBuildLabNavLink(t *testing.T) {
	httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
	reqCtx := &contextmodel.ReqContext{
		SignedInUser: &user.SignedInUser{},
		Context:     &web.Context{Req: httpReq},
	}

	t.Run("Should return lab section with correct properties", func(t *testing.T) {
		service := ServiceImpl{
			cfg: setting.NewCfg(),
		}

		link := service.buildLabNavLink(reqCtx)

		require.Equal(t, navtree.NavIDLab, link.Id)
		require.Equal(t, "Lab", link.Text)
		require.Equal(t, "bolt", link.Icon)
		require.Equal(t, int64(navtree.WeightLab), link.SortWeight)
		require.True(t, link.IsNew)
		require.Equal(t, "/lab", link.Url)
	})

	t.Run("Should include feature toggles child link", func(t *testing.T) {
		service := ServiceImpl{
			cfg: setting.NewCfg(),
		}

		link := service.buildLabNavLink(reqCtx)

		require.Len(t, link.Children, 1)
		require.Equal(t, "lab-feature-toggles", link.Children[0].Id)
		require.Equal(t, "Feature toggles", link.Children[0].Text)
		require.Equal(t, "/lab/feature-toggles", link.Children[0].Url)
		require.Equal(t, "toggle-on", link.Children[0].Icon)
	})

	t.Run("Should respect AppSubURL", func(t *testing.T) {
		cfg := setting.NewCfg()
		cfg.AppSubURL = "/grafana"

		service := ServiceImpl{
			cfg: cfg,
		}

		link := service.buildLabNavLink(reqCtx)

		require.Equal(t, "/grafana/lab", link.Url)
		require.Equal(t, "/grafana/lab/feature-toggles", link.Children[0].Url)
	})
}
