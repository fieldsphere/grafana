package app

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/grafana/grafana-app-sdk/app"
	"github.com/grafana/grafana-app-sdk/operator"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/apps/live/pkg/apis/live/v1alpha1"
)

func TestPublishHandlerKeepsTransportOnLiveWS(t *testing.T) {
	body, err := json.Marshal(v1alpha1.PublishBody{Channel: "grafana/dashboard/uid/abc"})
	require.NoError(t, err)
	req := &app.CustomRouteRequest{Body: io.NopCloser(bytes.NewReader(body))}
	rec := httptest.NewRecorder()

	require.NoError(t, PublishHandler(context.Background(), rec, req))

	var rsp v1alpha1.PublishResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &rsp))
	require.Equal(t, "grafana/dashboard/uid/abc", rsp.Channel)
	require.True(t, rsp.Accepted)
	require.Equal(t, "/api/live/ws", rsp.Transport)
}

func TestChannelReconcilerIgnoresDeletes(t *testing.T) {
	r := NewChannelReconciler()
	result, err := r.doReconcile(context.Background(), operator.TypedReconcileRequest[*v1alpha1.Channel]{
		Action: operator.ReconcileActionDeleted,
	})
	require.NoError(t, err)
	require.Equal(t, operator.ReconcileResult{}, result)
}
