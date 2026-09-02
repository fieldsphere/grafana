package dashboard

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"k8s.io/apimachinery/pkg/runtime"
	k8srequest "k8s.io/apiserver/pkg/endpoints/request"
	"k8s.io/apiserver/pkg/registry/rest"

	dashv0 "github.com/grafana/grafana/apps/dashboard/pkg/apis/dashboard/v0alpha1"
	"github.com/grafana/grafana/pkg/services/dashboards"
)

func TestConnectionsConnectorListsDashboardsByLibraryPanelUID(t *testing.T) {
	svc := dashboards.NewFakeDashboardService(t)
	svc.On("GetDashboardsByLibraryPanelUID", mock.Anything, "panel-a", int64(1)).
		Return([]*dashboards.DashboardRef{
			{UID: "dash-1", FolderUID: "ops"},
			{UID: "dash-2", FolderUID: "infra"},
		}, nil).
		Once()

	connector := NewConnectionsConnector(svc)
	ctx := k8srequest.WithNamespace(context.Background(), "default")
	responder := &connectionsTestResponder{}

	handler, err := connector.(rest.Connecter).Connect(ctx, "panel-a", nil, responder)
	require.NoError(t, err)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/connections", nil).WithContext(ctx)
	handler.ServeHTTP(rec, req)

	require.NoError(t, responder.err)
	require.Equal(t, http.StatusOK, responder.status)
	results, ok := responder.obj.(*dashv0.SearchResults)
	require.True(t, ok)
	require.Equal(t, int64(2), results.TotalHits)
	require.Equal(t, "dash-1", results.Hits[0].Name)
	require.Equal(t, "ops", results.Hits[0].Folder)
	require.Equal(t, "dashboards", results.Hits[0].Resource)
}

type connectionsTestResponder struct {
	status int
	obj    runtime.Object
	err    error
}

func (r *connectionsTestResponder) Object(status int, obj runtime.Object) {
	r.status = status
	r.obj = obj
}

func (r *connectionsTestResponder) Error(err error) {
	r.err = err
}
