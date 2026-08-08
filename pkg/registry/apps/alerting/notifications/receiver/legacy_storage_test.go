package receiver

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
)

func TestLegacyStorageDelete_DryRunSkipsDeleteReceiver(t *testing.T) {
	ctx := testContext()
	service := &dryRunReceiverService{
		receiver: &ngmodels.Receiver{
			UID:        "receiver-uid",
			Name:       "receiver",
			Version:    "rv1",
			Provenance: ngmodels.ProvenanceNone,
		},
	}
	storage := &legacyStorage{
		service:    service,
		namespacer: grafanarequest.GetNamespaceMapper(nil),
		metadata:   receiverDryRunMetadata{},
	}

	obj, deleted, err := storage.Delete(ctx, "receiver-uid", nil, &metav1.DeleteOptions{DryRun: []string{metav1.DryRunAll}})
	require.NoError(t, err)
	require.False(t, deleted)
	require.False(t, service.deleteCalled)
	require.Equal(t, "receiver-uid", obj.(*model.Receiver).Name)
}

func testContext() context.Context {
	ctx := apirequest.WithNamespace(context.Background(), "default")
	return identity.WithRequester(ctx, &identity.StaticRequester{OrgID: 1})
}

type dryRunReceiverService struct {
	receiver     *ngmodels.Receiver
	deleteCalled bool
}

func (s *dryRunReceiverService) GetReceiver(_ context.Context, uid string, _ bool, _ identity.Requester) (*ngmodels.Receiver, error) {
	if uid == s.receiver.UID {
		return s.receiver, nil
	}
	return nil, ngmodels.ErrReceiverNotFound.Errorf("receiver %q not found", uid)
}

func (s *dryRunReceiverService) GetReceivers(context.Context, ngmodels.GetReceiversQuery, identity.Requester) ([]*ngmodels.Receiver, error) {
	return nil, nil
}

func (s *dryRunReceiverService) CreateReceiver(context.Context, *ngmodels.Receiver, int64, identity.Requester) (*ngmodels.Receiver, error) {
	return nil, nil
}

func (s *dryRunReceiverService) UpdateReceiver(context.Context, *ngmodels.Receiver, map[string][]string, int64, identity.Requester) (*ngmodels.Receiver, error) {
	return nil, nil
}

func (s *dryRunReceiverService) DeleteReceiver(context.Context, string, ngmodels.Provenance, string, int64, identity.Requester) error {
	s.deleteCalled = true
	return nil
}

type receiverDryRunMetadata struct{}

func (receiverDryRunMetadata) AccessControlMetadata(context.Context, identity.Requester, ...*ngmodels.Receiver) (map[string]ngmodels.ReceiverPermissionSet, error) {
	return nil, nil
}

func (receiverDryRunMetadata) InUseMetadata(context.Context, int64, ...*ngmodels.Receiver) (map[string]ngmodels.ReceiverMetadata, error) {
	return nil, nil
}
