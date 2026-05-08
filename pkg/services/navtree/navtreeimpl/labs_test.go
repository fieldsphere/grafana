package navtreeimpl

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	accesscontrolmock "github.com/grafana/grafana/pkg/services/accesscontrol/mock"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/navtree"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestBuildLabsNavLink(t *testing.T) {
	cfg := setting.NewCfg()
	httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
	reqCtx := &contextmodel.ReqContext{
		SignedInUser: &user.SignedInUser{},
		Context:      &web.Context{Req: httpReq},
	}

	t.Run("without settings access returns nil", func(t *testing.T) {
		acMock := accesscontrolmock.New().WithPermissions([]ac.Permission{})
		s := &ServiceImpl{cfg: cfg, accessControl: acMock}
		require.Nil(t, s.buildLabsNavLink(reqCtx))
	})

	t.Run("with global settings read returns labs nav", func(t *testing.T) {
		acMock := accesscontrolmock.New().WithPermissions([]ac.Permission{
			{Action: ac.ActionSettingsRead, Scope: ac.ScopeSettingsAll},
		})
		s := &ServiceImpl{cfg: cfg, accessControl: acMock}
		link := s.buildLabsNavLink(reqCtx)
		require.NotNil(t, link)
		require.Equal(t, navtree.NavIDLabs, link.Id)
		require.True(t, link.IsNew)
		require.Len(t, link.Children, 1)
		require.Equal(t, cfg.AppSubURL+"/labs/feature-flags", link.Children[0].Url)
	})
}
