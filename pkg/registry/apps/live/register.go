package live

import (
	"context"

	"k8s.io/apiserver/pkg/authorization/authorizer"
	restclient "k8s.io/client-go/rest"

	"github.com/grafana/grafana-app-sdk/app"
	appsdkapiserver "github.com/grafana/grafana-app-sdk/k8s/apiserver"
	"github.com/grafana/grafana-app-sdk/simple"
	apis "github.com/grafana/grafana/apps/live/pkg/apis/manifestdata"
	liveapp "github.com/grafana/grafana/apps/live/pkg/app"
	"github.com/grafana/grafana/pkg/apimachinery/identity"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	grafanalive "github.com/grafana/grafana/pkg/services/live"
	"github.com/grafana/grafana/pkg/setting"
)

const pushResource = "push"

var (
	_ appsdkapiserver.AppInstaller = (*AppInstaller)(nil)
)

type AppInstaller struct {
	appsdkapiserver.AppInstaller
	cfg *setting.Cfg
}

func RegisterAppInstaller(
	cfg *setting.Cfg,
	features featuremgmt.FeatureToggles,
	gl *grafanalive.GrafanaLive,
) (*AppInstaller, error) {
	installer := &AppInstaller{
		cfg: cfg,
	}

	provider := simple.NewAppProvider(apis.LocalManifest(), nil, liveapp.New)

	appConfig := app.Config{
		KubeConfig:   restclient.Config{},
		ManifestData: *apis.LocalManifest().ManifestData,
		SpecificConfig: &liveapp.LiveConfig{
			Enable:           true,
			WebSocketHandler: newWebSocketHandler(gl),
			ListHandler:      newListHandler(gl),
			PushGetHandler:   newPushGetHandler(gl),
			PushPostHandler:  newPushPostHandler(gl),
		},
	}
	i, err := appsdkapiserver.NewDefaultAppInstaller(provider, appConfig, apis.NewGoTypeAssociator())
	if err != nil {
		return nil, err
	}
	installer.AppInstaller = i

	return installer, nil
}

func (a *AppInstaller) GetAuthorizer() authorizer.Authorizer {
	return authorizer.AuthorizerFunc(func(
		ctx context.Context, attr authorizer.Attributes,
	) (authorized authorizer.Decision, reason string, err error) {
		if !attr.IsResourceRequest() {
			return authorizer.DecisionNoOpinion, "", nil
		}

		if attr.GetResource() == pushResource {
			user, err := identity.GetRequester(ctx)
			if err != nil {
				return authorizer.DecisionDeny, "valid user is required", err
			}
			switch attr.GetVerb() {
			case "get", "connect":
				if !isOrgAdmin(user) {
					return authorizer.DecisionDeny, "org admin is required", nil
				}
			case "create":
				if !hasLivePushPermission(user) {
					return authorizer.DecisionDeny, "missing live:push permission", nil
				}
			default:
				return authorizer.DecisionDeny, "unsupported verb: " + attr.GetVerb(), nil
			}
		}

		return authorizer.DecisionAllow, "", nil
	})
}
