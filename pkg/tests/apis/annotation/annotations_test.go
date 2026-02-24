package annotation

import (
	"context"
	"encoding/json"
	"fmt"
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

	legacyCmd := map[string]any{
		"time": int64(1000),
		"text": "hello",
		"tags": []string{"tag1"},
	}
	legacyBody, err := json.Marshal(legacyCmd)
	require.NoError(t, err)

	type legacyCreateResponse struct {
		Message string `json:"message"`
		ID      int64  `json:"id"`
	}
	legacyCreate := apis.DoRequest(helper, apis.RequestParams{
		Method: http.MethodPost,
		Path:   "/api/annotations",
		User:   helper.Org1.Admin,
		Body:   legacyBody,
	}, &legacyCreateResponse{})
	require.Equal(t, http.StatusOK, legacyCreate.Response.StatusCode, "create annotation via legacy API")
	require.NotNil(t, legacyCreate.Result)
	require.NotZero(t, legacyCreate.Result.ID)

	name := fmt.Sprintf("a-%d", legacyCreate.Result.ID)

	got, err := client.Resource.Get(ctx, name, metav1.GetOptions{})
	require.NoError(t, err)
	require.Equal(t, name, got.GetName())

	list, err := client.Resource.List(ctx, metav1.ListOptions{})
	require.NoError(t, err)
	require.Len(t, list.Items, 1)

	namespace := helper.Namespacer(helper.Org1.OrgID)
	search := apis.DoRequest(helper, apis.RequestParams{
		Method: http.MethodGet,
		Path:   "/apis/annotation.grafana.app/v0alpha1/namespaces/" + namespace + "/search?tag=tag1",
		User:   helper.Org1.Admin,
	}, &annotationV0.AnnotationList{})
	require.Equal(t, http.StatusOK, search.Response.StatusCode, "search annotations")
	require.NotNil(t, search.Result)
	require.Len(t, search.Result.Items, 1)

	tags := apis.DoRequest(helper, apis.RequestParams{
		Method: http.MethodGet,
		Path:   "/apis/annotation.grafana.app/v0alpha1/namespaces/" + namespace + "/tags",
		User:   helper.Org1.Admin,
	}, &annotationV0.GetTagsResponse{})
	require.Equal(t, http.StatusOK, tags.Response.StatusCode, "get tags")
	require.NotNil(t, tags.Result)
	require.NotEmpty(t, tags.Result.Tags)
}
