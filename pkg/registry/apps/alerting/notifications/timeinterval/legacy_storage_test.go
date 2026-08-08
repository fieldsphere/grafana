package timeinterval

import (
	"context"
	"testing"

	"github.com/prometheus/alertmanager/config"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	apirequest "k8s.io/apiserver/pkg/endpoints/request"

	model "github.com/grafana/grafana/apps/alerting/notifications/pkg/apis/alertingnotifications/v1beta1"
	"github.com/grafana/grafana/pkg/apimachinery/identity"
	grafanarequest "github.com/grafana/grafana/pkg/services/apiserver/endpoints/request"
	"github.com/grafana/grafana/pkg/services/ngalert/api/tooling/definitions"
)

func TestLegacyStorageDelete_DryRunSkipsDeleteMuteTiming(t *testing.T) {
	ctx := testContext()
	interval := definitions.MuteTimeInterval{
		UID:              "interval-uid",
		MuteTimeInterval: config.MuteTimeInterval{Name: "interval"},
		Version:          "rv1",
	}
	service := &dryRunTimeIntervalService{intervals: []definitions.MuteTimeInterval{interval}}
	storage := &legacyStorage{
		service:    service,
		namespacer: grafanarequest.GetNamespaceMapper(nil),
	}

	obj, deleted, err := storage.Delete(ctx, "interval-uid", nil, &metav1.DeleteOptions{DryRun: []string{metav1.DryRunAll}})
	require.NoError(t, err)
	require.False(t, deleted)
	require.False(t, service.deleteCalled)
	require.Equal(t, "interval-uid", obj.(*model.TimeInterval).Name)
}

func testContext() context.Context {
	ctx := apirequest.WithNamespace(context.Background(), "default")
	return identity.WithRequester(ctx, &identity.StaticRequester{OrgID: 1})
}

type dryRunTimeIntervalService struct {
	intervals    []definitions.MuteTimeInterval
	deleteCalled bool
}

func (s *dryRunTimeIntervalService) GetMuteTimings(context.Context, int64) ([]definitions.MuteTimeInterval, error) {
	return s.intervals, nil
}

func (s *dryRunTimeIntervalService) CreateMuteTiming(context.Context, definitions.MuteTimeInterval, int64) (definitions.MuteTimeInterval, error) {
	return definitions.MuteTimeInterval{}, nil
}

func (s *dryRunTimeIntervalService) UpdateMuteTiming(context.Context, definitions.MuteTimeInterval, int64) (definitions.MuteTimeInterval, error) {
	return definitions.MuteTimeInterval{}, nil
}

func (s *dryRunTimeIntervalService) DeleteMuteTiming(context.Context, string, int64, definitions.Provenance, string) error {
	s.deleteCalled = true
	return nil
}
