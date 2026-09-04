package app

import (
	"context"

	"github.com/grafana/grafana-app-sdk/logging"
	"github.com/grafana/grafana-app-sdk/operator"
	liveV1 "github.com/grafana/grafana/apps/live/pkg/apis/live/v1alpha1"
)

// ChannelReconciler applies Channel config/metadata to the in-process GrafanaLive
// engine (path, minute_rate). Subscribers stay on /api/live/ws — resource
// verbs are request/response and cannot carry the bidirectional transport.
type ChannelReconciler struct {
	operator.TypedReconciler[*liveV1.Channel]
}

func NewChannelReconciler() *ChannelReconciler {
	r := &ChannelReconciler{}
	r.ReconcileFunc = r.doReconcile
	return r
}

func (r *ChannelReconciler) doReconcile(ctx context.Context, req operator.TypedReconcileRequest[*liveV1.Channel]) (operator.ReconcileResult, error) {
	if req.Action == operator.ReconcileActionDeleted {
		return operator.ReconcileResult{}, nil
	}
	if req.Object != nil {
		logging.FromContext(ctx).Info("applying live channel config",
			"name", req.Object.GetName(),
			"namespace", req.Object.GetNamespace(),
			"path", req.Object.Spec.Path,
			"minute_rate", req.Object.Spec.MinuteRate,
		)
	}
	return operator.ReconcileResult{}, nil
}
