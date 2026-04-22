package navtreeimpl

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	accesscontrolmock "github.com/grafana/grafana/pkg/services/accesscontrol/mock"
	"github.com/grafana/grafana/pkg/services/authn"
	"github.com/grafana/grafana/pkg/services/authn/authntest"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/licensing"
	"github.com/grafana/grafana/pkg/services/navtree"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestGetAdminNodeAddsLabsLinkWithFeatureManagementRead(t *testing.T) {
	httpReq, _ := http.NewRequest(http.MethodGet, "", nil)
	reqCtx := &contextmodel.ReqContext{
		SignedInUser: &user.SignedInUser{
			OrgID:   1,
			OrgName: "TestOrg",
			OrgRole: identity.RoleAdmin,
		},
		Context: &web.Context{Req: httpReq},
	}

	service := ServiceImpl{
		cfg:           setting.NewCfg(),
		features:      featuremgmt.WithFeatures(),
		accessControl: accesscontrolmock.New().WithPermissions([]ac.Permission{{Action: ac.ActionFeatureManagementRead}}),
		license:       &licensing.OSSLicensingService{},
		authnService:  &authntest.FakeService{ExpectedIdentity: &authn.Identity{}},
	}

	node, err := service.getAdminNode(reqCtx)
	require.NoError(t, err)
	require.NotNil(t, node)

	labsNode := navtree.FindById(node.Children, "labs")
	require.NotNil(t, labsNode)
	require.Equal(t, "Labs", labsNode.Text)
	require.Equal(t, "/admin/labs", labsNode.Url)
}
