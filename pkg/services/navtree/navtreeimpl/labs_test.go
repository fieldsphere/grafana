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

func TestGetLabsNode(t *testing.T) {
	httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
	reqCtx := &contextmodel.ReqContext{
		SignedInUser: &user.SignedInUser{},
		Context:      &web.Context{Req: httpReq},
	}

	t.Run("returns labs node for settings readers", func(t *testing.T) {
		service := ServiceImpl{
			cfg:           setting.NewCfg(),
			accessControl: accesscontrolmock.New().WithPermissions([]ac.Permission{{Action: ac.ActionSettingsRead, Scope: ac.ScopeSettingsAll}}),
		}

		node := service.getLabsNode(reqCtx)
		require.NotNil(t, node)
		require.Equal(t, navtree.NavIDLabs, node.Id)
		require.Equal(t, "/labs", node.Url)
	})

	t.Run("hides labs node without settings access", func(t *testing.T) {
		service := ServiceImpl{
			cfg:           setting.NewCfg(),
			accessControl: accesscontrolmock.New().WithPermissions([]ac.Permission{{Action: "wrong"}}),
		}

		require.Nil(t, service.getLabsNode(reqCtx))
	})
}
