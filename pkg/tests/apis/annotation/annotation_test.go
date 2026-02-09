package annotation

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"

	annotationV0 "github.com/grafana/grafana/apps/annotation/pkg/apis/annotation/v0alpha1"
	grafanarest "github.com/grafana/grafana/pkg/apiserver/rest"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/tests/apis"
	"github.com/grafana/grafana/pkg/tests/testinfra"
	"github.com/grafana/grafana/pkg/tests/testsuite"
	"github.com/grafana/grafana/pkg/util/testutil"
)

func TestMain(m *testing.M) {
	testsuite.Run(m)
}

func TestIntegrationAnnotation(t *testing.T) {
	testutil.SkipIntegrationTestInShortMode(t)

	for _, mode := range []grafanarest.DualWriterMode{
		grafanarest.Mode0, // Only legacy for now
	} {
		t.Run(fmt.Sprintf("annotations (mode:%d)", mode), func(t *testing.T) {
			helper := apis.NewK8sTestHelper(t, testinfra.GrafanaOpts{
				DisableAnonymous:     true,
				EnableFeatureToggles: []string{featuremgmt.FlagKubernetesAnnotations},
				UnifiedStorageConfig: map[string]setting.UnifiedStorageConfig{
					"annotation.annotation.grafana.app": {
						DualWriterMode: mode,
					},
				},
			})

			ctx := context.Background()
			kind := annotationV0.AnnotationKind()
			annotationsClient := helper.GetResourceClient(apis.ResourceClientArgs{
				User: helper.Org1.Admin,
				GVR:  kind.GroupVersionResource(),
			})

			// Create an annotation
			now := time.Now().UnixMilli()
			annotationObj := &unstructured.Unstructured{
				Object: map[string]interface{}{
					"apiVersion": annotationV0.GroupVersion.String(),
					"kind":       "Annotation",
					"metadata": map[string]interface{}{
						"generateName": "test-annotation-",
					},
					"spec": map[string]interface{}{
						"text": "Test annotation",
						"time": now,
						"tags": []interface{}{"test", "integration"},
					},
				},
			}

			createdUnstructured, err := annotationsClient.Resource.Create(ctx, annotationObj, metav1.CreateOptions{})
			require.NoError(t, err)
			require.NotEmpty(t, createdUnstructured.GetName(), "created annotation should have a name")
			annotationName := createdUnstructured.GetName()

			// List annotations
			listResults, err := annotationsClient.Resource.List(ctx, metav1.ListOptions{})
			require.NoError(t, err)
			require.Len(t, listResults.Items, 1)
			require.Equal(t, annotationName, listResults.Items[0].GetName())

			// Get annotation by name
			getResult, err := annotationsClient.Resource.Get(ctx, annotationName, metav1.GetOptions{})
			require.NoError(t, err)
			require.Equal(t, annotationName, getResult.GetName())

			// Verify the spec fields
			spec, found, err := unstructured.NestedMap(getResult.Object, "spec")
			require.NoError(t, err)
			require.True(t, found, "spec should exist")
			require.Equal(t, "Test annotation", spec["text"])
			require.Equal(t, float64(now), spec["time"])
		})
	}
}
