package navtreeimpl

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	"github.com/grafana/grafana/pkg/infra/log"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	accesscontrolmock "github.com/grafana/grafana/pkg/services/accesscontrol/mock"
	"github.com/grafana/grafana/pkg/services/authn"
	"github.com/grafana/grafana/pkg/services/authn/authntest"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/licensing/licensingtest"
	"github.com/grafana/grafana/pkg/services/navtree"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestGetAdminNodeAddsLabsFeatureFlagsPage(t *testing.T) {
	httpReq, _ := http.NewRequest(http.MethodGet, "", nil)

	reqCtx := &contextmodel.ReqContext{
		SignedInUser: &user.SignedInUser{
			UserID:      1,
			OrgID:       1,
			OrgRole:     identity.RoleAdmin,
			OrgName:     "Test org",
			Name:        "admin",
			Permissions: map[int64]map[string][]string{1: {}},
		},
		Context:    &web.Context{Req: httpReq},
		IsSignedIn: true,
		Logger:     log.NewNopLogger(),
	}

	fakeLicense := licensingtest.NewFakeLicensing()
	fakeLicense.On("FeatureEnabled", "saml").Return(false)
	fakeLicense.On("FeatureEnabled", "groupsync").Return(false)

	service := ServiceImpl{
		cfg:      setting.NewCfg(),
		log:      log.NewNopLogger(),
		license:  fakeLicense,
		features: featuremgmt.WithFeatures(),
		accessControl: accesscontrolmock.New().WithPermissions([]ac.Permission{
			{Action: ac.ActionFeatureManagementRead},
		}),
		authnService: &authntest.FakeService{
			ExpectedIdentity: &authn.Identity{
				ID:       "user:1",
				UID:      "1",
				Type:     "user",
				OrgID:    ac.GlobalOrgID,
				OrgRoles: map[int64]identity.RoleType{ac.GlobalOrgID: identity.RoleAdmin},
				Permissions: map[int64]map[string][]string{
					ac.GlobalOrgID: {
						ac.ActionFeatureManagementRead: {""},
					},
				},
			},
		},
	}

	node, err := service.getAdminNode(reqCtx)
	require.NoError(t, err)
	require.NotNil(t, node)

	labsNode := navtree.FindById(node.Children, navtree.NavIDCfgLabs)
	require.NotNil(t, labsNode)
	require.Equal(t, "Labs", labsNode.Text)

	featureFlagsNode := navtree.FindById(node.Children, navtree.NavIDFeatureFlagDashboard)
	require.NotNil(t, featureFlagsNode)
	require.Equal(t, "/admin/labs/feature-flags", featureFlagsNode.Url)
	require.True(t, featureFlagsNode.IsNew)
}
