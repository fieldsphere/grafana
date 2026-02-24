package annotation

import (
	"context"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	annotationV0 "github.com/grafana/grafana/apps/annotation/pkg/apis/annotation/v0alpha1"
	"github.com/grafana/grafana/pkg/tests/apis"
	"github.com/grafana/grafana/pkg/tests/testinfra"
	"github.com/grafana/grafana/pkg/tests/testsuite"
	"github.com/grafana/grafana/pkg/util/testutil"
)

func TestMain(m *testing.M) {
	testsuite.Run(m)
}

func TestIntegrationAnnotations(t *testing.T) {
	testutil.SkipIntegrationTestInShortMode(t)

	helper := apis.NewK8sTestHelper(t, testinfra.GrafanaOpts{
		DisableAnonymous:                true,
		KubernetesAnnotationsAppEnabled: true,
	})

	ctx := context.Background()
	kind := annotationV0.AnnotationKind()
	client := helper.GetResourceClient(apis.ResourceClientArgs{
		User: helper.Org1.Admin,
		GVR:  kind.GroupVersionResource(),
	})

	create := helper.PostResource(helper.Org1.Admin, "annotations", apis.AnyResource{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "annotation.grafana.app/v0alpha1",
			Kind:       "Annotation",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: "a-1",
		},
		Spec: map[string]any{
			"text":   "hello",
			"time":   int64(1000),
			"tags":   []string{"tag1"},
			"scopes": []string{"scope1"},
		},
	})
	require.Equal(t, http.StatusCreated, create.Response.StatusCode, "create annotation")
	require.NotNil(t, create.Result)
	require.Equal(t, "a-1", create.Result.Name)

	got, err := client.Resource.Get(ctx, "a-1", metav1.GetOptions{})
	require.NoError(t, err)
	require.Equal(t, "a-1", got.GetName())

	list, err := client.Resource.List(ctx, metav1.ListOptions{})
	require.NoError(t, err)
	require.Len(t, list.Items, 1)

	namespace := helper.Namespacer(helper.Org1.OrgID)
	tags := apis.DoRequest(helper, apis.RequestParams{
		Method: http.MethodGet,
		Path:   "/apis/annotation.grafana.app/v0alpha1/namespaces/" + namespace + "/tags",
		User:   helper.Org1.Admin,
	}, &annotationV0.GetTagsResponse{})
	require.Equal(t, http.StatusOK, tags.Response.StatusCode, "get tags")
	require.NotNil(t, tags.Result)
	require.NotEmpty(t, tags.Result.Tags)
}
