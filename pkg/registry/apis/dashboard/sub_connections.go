package dashboard

import (
	"context"
	"net/http"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/rest"

	dashv0 "github.com/grafana/grafana/apps/dashboard/pkg/apis/dashboard/v0alpha1"
	"github.com/grafana/grafana/pkg/services/apiserver/endpoints/request"
	"github.com/grafana/grafana/pkg/services/dashboards"
)

// ConnectionsConnector lists dashboards that embed a library panel.
// Connections are derived from unified search, not a stored resource.
type ConnectionsConnector struct {
	dashboardService dashboards.DashboardService
}

func NewConnectionsConnector(dashboardService dashboards.DashboardService) rest.Storage {
	return &ConnectionsConnector{dashboardService: dashboardService}
}

var (
	_ rest.Connecter       = (*ConnectionsConnector)(nil)
	_ rest.StorageMetadata = (*ConnectionsConnector)(nil)
	_ rest.Storage         = (*ConnectionsConnector)(nil)
)

func (r *ConnectionsConnector) New() runtime.Object {
	return &dashv0.SearchResults{}
}

func (r *ConnectionsConnector) Destroy() {}

func (r *ConnectionsConnector) ConnectMethods() []string {
	return []string{"GET"}
}

func (r *ConnectionsConnector) NewConnectOptions() (runtime.Object, bool, string) {
	return nil, false, ""
}

func (r *ConnectionsConnector) ProducesMIMETypes(verb string) []string {
	return []string{"application/json"}
}

func (r *ConnectionsConnector) ProducesObject(verb string) interface{} {
	return r.New()
}

func (r *ConnectionsConnector) Connect(ctx context.Context, name string, _ runtime.Object, responder rest.Responder) (http.Handler, error) {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		info, err := request.NamespaceInfoFrom(ctx, true)
		if err != nil {
			responder.Error(err)
			return
		}

		refs, err := r.dashboardService.GetDashboardsByLibraryPanelUID(ctx, name, info.OrgID)
		if err != nil {
			responder.Error(err)
			return
		}

		hits := make([]dashv0.DashboardHit, 0, len(refs))
		for _, ref := range refs {
			if ref == nil || ref.UID == "" {
				continue
			}
			hits = append(hits, dashv0.DashboardHit{
				Resource: "dashboards",
				Name:     ref.UID,
				Folder:   ref.FolderUID,
			})
		}

		responder.Object(http.StatusOK, &dashv0.SearchResults{
			TypeMeta: metav1.TypeMeta{
				Kind:       "SearchResults",
				APIVersion: dashv0.APIVERSION,
			},
			TotalHits: int64(len(hits)),
			Hits:      hits,
		})
	}), nil
}
