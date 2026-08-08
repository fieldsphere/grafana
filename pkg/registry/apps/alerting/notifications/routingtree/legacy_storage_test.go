package routingtree

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	apirequest "k8s.io/apiserver/pkg/endpoints/request"

	model "github.com/grafana/grafana/apps/alerting/notifications/pkg/apis/alertingnotifications/v1beta1"
	"github.com/grafana/grafana/pkg/apimachinery/identity"
	grafanarequest "github.com/grafana/grafana/pkg/services/apiserver/endpoints/request"
	ngmodels "github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/services/ngalert/notifier/legacy_storage"
	v1 "github.com/grafana/grafana/pkg/services/ngalert/notifier/legacy_storage/v1"
)

func TestLegacyStorageDelete_DryRunSkipsDeleteManagedRoute(t *testing.T) {
	ctx := testContext()
	route := legacy_storage.NewManagedRoute("team-a", &v1.Route{Receiver: "receiver"})
	service := &dryRunRouteService{route: *route}
	storage := &legacyStorage{
		service:    service,
		namespacer: grafanarequest.GetNamespaceMapper(nil),
		metadata:   routeDryRunMetadata{},
	}

	obj, deleted, err := storage.Delete(ctx, "team-a", nil, &metav1.DeleteOptions{DryRun: []string{metav1.DryRunAll}})
	require.NoError(t, err)
	require.False(t, deleted)
	require.False(t, service.deleteCalled)
	require.Equal(t, "team-a", obj.(*model.RoutingTree).Name)
}

func testContext() context.Context {
	ctx := apirequest.WithNamespace(context.Background(), "default")
	return identity.WithRequester(ctx, &identity.StaticRequester{OrgID: 1})
}

type dryRunRouteService struct {
	route        legacy_storage.ManagedRoute
	deleteCalled bool
}

func (s *dryRunRouteService) GetManagedRoutes(context.Context, int64, identity.Requester) (legacy_storage.ManagedRoutes, error) {
	return legacy_storage.ManagedRoutes{&s.route}, nil
}

func (s *dryRunRouteService) GetManagedRoute(context.Context, int64, string, identity.Requester) (legacy_storage.ManagedRoute, error) {
	return s.route, nil
}

func (s *dryRunRouteService) DeleteManagedRoute(context.Context, int64, string, ngmodels.Provenance, string, identity.Requester) error {
	s.deleteCalled = true
	return nil
}

func (s *dryRunRouteService) CreateManagedRoute(context.Context, int64, string, v1.Route, ngmodels.Provenance, identity.Requester) (*legacy_storage.ManagedRoute, error) {
	return nil, nil
}

func (s *dryRunRouteService) UpdateManagedRoute(context.Context, int64, string, v1.Route, ngmodels.Provenance, string, identity.Requester) (*legacy_storage.ManagedRoute, error) {
	return nil, nil
}

type routeDryRunMetadata struct{}

func (routeDryRunMetadata) AccessControlMetadata(context.Context, identity.Requester, ...*legacy_storage.ManagedRoute) (map[string]ngmodels.RoutePermissionSet, error) {
	return nil, nil
}
