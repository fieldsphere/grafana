package app

import (
	"context"

	"github.com/grafana/grafana-app-sdk/app"
	"github.com/grafana/grafana-app-sdk/resource"
	"github.com/grafana/grafana-app-sdk/simple"
	"k8s.io/apimachinery/pkg/runtime/schema"

	liveV1 "github.com/grafana/grafana/apps/live/pkg/apis/live/v1alpha1"
)

type liveRouteHandler func(ctx context.Context, writer app.CustomRouteResponseWriter, request *app.CustomRouteRequest) error

// LiveConfig holds optional custom-route handlers injected by the registry layer.
// Channel CRUD is always available when the live app is installed; transport
// routes (ws/list/push) are only wired when handlers are provided.
type LiveConfig struct {
	Enable bool

	WebSocketHandler liveRouteHandler
	ListHandler      liveRouteHandler
	PushGetHandler   liveRouteHandler
	PushPostHandler  liveRouteHandler
}

func New(cfg app.Config) (app.App, error) {
	cfg.KubeConfig.APIPath = "/apis"

	routes := simple.AppVersionRouteHandlers{
		{
			Namespaced: true,
			Path:       "something",
			Method:     "GET",
		}: GetSomethingHandler,
	}

	if liveConfig, ok := cfg.SpecificConfig.(*LiveConfig); ok && liveConfig != nil {
		if liveConfig.WebSocketHandler != nil {
			routes[simple.AppVersionRoute{Namespaced: true, Path: "ws", Method: "GET"}] = simple.AppCustomRouteHandler(liveConfig.WebSocketHandler)
		}
		if liveConfig.ListHandler != nil {
			routes[simple.AppVersionRoute{Namespaced: true, Path: "list", Method: "GET"}] = simple.AppCustomRouteHandler(liveConfig.ListHandler)
		}
		if liveConfig.PushGetHandler != nil {
			routes[simple.AppVersionRoute{Namespaced: true, Path: "push/{streamId}", Method: "GET"}] = simple.AppCustomRouteHandler(liveConfig.PushGetHandler)
		}
		if liveConfig.PushPostHandler != nil {
			routes[simple.AppVersionRoute{Namespaced: true, Path: "push/{streamId}", Method: "POST"}] = simple.AppCustomRouteHandler(liveConfig.PushPostHandler)
		}
	}

	simpleConfig := simple.AppConfig{
		Name:       "live",
		KubeConfig: cfg.KubeConfig,
		ManagedKinds: []simple.AppManagedKind{
			{
				Kind: liveV1.ChannelKind(),
			},
		},
		VersionedCustomRoutes: map[string]simple.AppVersionRouteHandlers{
			"v1alpha1": routes,
		},
	}

	a, err := simple.NewApp(simpleConfig)
	if err != nil {
		return nil, err
	}

	err = a.ValidateManifest(cfg.ManifestData)
	if err != nil {
		return nil, err
	}

	return a, nil
}

func GetKinds() map[schema.GroupVersion][]resource.Kind {
	return map[schema.GroupVersion][]resource.Kind{
		liveV1.GroupVersion: {
			liveV1.ChannelKind(),
		},
	}
}
