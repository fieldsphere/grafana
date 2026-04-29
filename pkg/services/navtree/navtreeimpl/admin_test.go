package navtreeimpl

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/accesscontrol/actest"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/licensing"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func TestGetAdminNodeIncludesFeatureToggles(t *testing.T) {
	httpReq, err := http.NewRequest(http.MethodGet, "", nil)
	require.NoError(t, err)

	service := ServiceImpl{
		cfg:           &setting.Cfg{},
		accessControl: actest.FakeAccessControl{ExpectedEvaluate: true},
		features:      featuremgmt.WithFeatures(),
		license:       &licensing.OSSLicensingService{},
	}
	reqCtx := &contextmodel.ReqContext{
		Context:      &web.Context{Req: httpReq},
		SignedInUser: &user.SignedInUser{UserID: 1, OrgID: 1, OrgName: "Main Org."},
	}

	adminNode, err := service.getAdminNode(reqCtx)
	require.NoError(t, err)

	var featureToggleNodeFound bool
	for _, section := range adminNode.Children {
		for _, child := range section.Children {
			if child.Id == "feature-toggles" {
				featureToggleNodeFound = true
				require.Equal(t, "Feature flags", child.Text)
				require.Equal(t, "/admin/feature-toggles", child.Url)
			}
		}
	}
	require.True(t, featureToggleNodeFound)
}
