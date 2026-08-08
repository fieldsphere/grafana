package templategroup

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
	v1 "github.com/grafana/grafana/pkg/services/ngalert/notifier/legacy_storage/v1"
)

func TestLegacyStorageDelete_DryRunSkipsDeleteTemplate(t *testing.T) {
	ctx := testContext()
	template := v1.NewTemplateGroup("custom", "{{ define \"custom\" }}custom{{ end }}", v1.TemplateKindGrafana, ngmodels.ProvenanceNone)
	service := &dryRunTemplateService{template: template}
	storage := &legacyStorage{
		service:    service,
		namespacer: grafanarequest.GetNamespaceMapper(nil),
	}

	obj, deleted, err := storage.Delete(ctx, string(template.UID), nil, &metav1.DeleteOptions{DryRun: []string{metav1.DryRunAll}})
	require.NoError(t, err)
	require.False(t, deleted)
	require.False(t, service.deleteCalled)
	require.Equal(t, string(template.UID), obj.(*model.TemplateGroup).Name)
}

func testContext() context.Context {
	ctx := apirequest.WithNamespace(context.Background(), "default")
	return identity.WithRequester(ctx, &identity.StaticRequester{OrgID: 1})
}

type dryRunTemplateService struct {
	template     v1.TemplateGroup
	deleteCalled bool
}

func (s *dryRunTemplateService) GetTemplate(context.Context, int64, string) (v1.TemplateGroup, error) {
	return s.template, nil
}

func (s *dryRunTemplateService) GetTemplates(context.Context, int64) ([]v1.TemplateGroup, error) {
	return nil, nil
}

func (s *dryRunTemplateService) CreateTemplate(context.Context, int64, v1.TemplateGroup) (v1.TemplateGroup, error) {
	return v1.TemplateGroup{}, nil
}

func (s *dryRunTemplateService) UpdateTemplate(context.Context, int64, v1.TemplateGroup) (v1.TemplateGroup, error) {
	return v1.TemplateGroup{}, nil
}

func (s *dryRunTemplateService) DeleteTemplate(context.Context, int64, string, ngmodels.Provenance, string) error {
	s.deleteCalled = true
	return nil
}
