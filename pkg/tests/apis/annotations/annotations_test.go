package annotations

import (
	"context"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"

	annotationV0 "github.com/grafana/grafana/apps/annotation/pkg/apis/annotation/v0alpha1"
	grafanarest "github.com/grafana/grafana/pkg/apiserver/rest"
	"github.com/grafana/grafana/pkg/services/annotations"
	"github.com/grafana/grafana/pkg/services/apiserver/options"
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

var gvr = schema.GroupVersionResource{
	Group:    annotationV0.APIGroup,
	Version:  annotationV0.APIVersion,
	Resource: "annotations",
}

var RESOURCEGROUP = gvr.GroupResource().String()

func TestIntegrationAnnotation(t *testing.T) {
	testutil.SkipIntegrationTestInShortMode(t)

	t.Run("default setup with k8s flag turned off (legacy APIs)", func(t *testing.T) {
		helper := apis.NewK8sTestHelper(t, testinfra.GrafanaOpts{
			AppModeProduction:    true, // do not start extra port 6443
			DisableAnonymous:     true,
			EnableFeatureToggles: []string{}, // legacy APIs only
		})
		// In this setup, K8s APIs are not available - legacy APIs only
		doLegacyOnlyTests(t, helper)

		// When no feature toggles are enabled, annotation K8s APIs should not be available
		disco := helper.NewDiscoveryClient()
		groups, err := disco.ServerGroups()
		require.NoError(t, err)

		hasAnnotationGroup := false
		for _, group := range groups.Groups {
			if group.Name == annotationV0.APIGroup {
				hasAnnotationGroup = true
				break
			}
		}
		require.False(t, hasAnnotationGroup, "annotation K8s APIs should not be available when kubernetesAnnotations feature toggle is disabled")
	})

	t.Run("with dual write (unified storage, mode 0)", func(t *testing.T) {
		helper := apis.NewK8sTestHelper(t, testinfra.GrafanaOpts{
			AppModeProduction:    false, // required for unified storage
			DisableAnonymous:     true,
			APIServerStorageType: options.StorageTypeUnified,
			EnableFeatureToggles: []string{featuremgmt.FlagKubernetesAnnotations},
			UnifiedStorageConfig: map[string]setting.UnifiedStorageConfig{
				RESOURCEGROUP: {
					DualWriterMode: grafanarest.Mode0,
				},
			},
		})
		doLegacyOnlyTests(t, helper)
	})

	t.Run("modes", func(t *testing.T) {
		for _, mode := range []grafanarest.DualWriterMode{
			grafanarest.Mode1,
			grafanarest.Mode2,
			grafanarest.Mode3,
			grafanarest.Mode4,
		} {
			t.Run(fmt.Sprintf("dual write (unified storage, mode %d)", mode), func(t *testing.T) {
				helper := apis.NewK8sTestHelper(t, testinfra.GrafanaOpts{
					AppModeProduction:    false,
					DisableAnonymous:     true,
					APIServerStorageType: options.StorageTypeUnified,
					EnableFeatureToggles: []string{
						featuremgmt.FlagKubernetesAnnotations,
					},
					UnifiedStorageConfig: map[string]setting.UnifiedStorageConfig{
						RESOURCEGROUP: {
							DualWriterMode: mode,
						},
					},
				})
				doDualWriteTests(t, helper, mode)
			})
		}
	})

	t.Run("with dual write (unified storage, mode 5)", func(t *testing.T) {
		helper := apis.NewK8sTestHelper(t, testinfra.GrafanaOpts{
			AppModeProduction:    false,
			DisableAnonymous:     true,
			APIServerStorageType: options.StorageTypeUnified,
			EnableFeatureToggles: []string{
				featuremgmt.FlagKubernetesAnnotations,
			},
			UnifiedStorageConfig: map[string]setting.UnifiedStorageConfig{
				RESOURCEGROUP: {
					DualWriterMode: grafanarest.Mode5,
				},
			},
		})
		doUnifiedOnlyTests(t, helper)
	})
}

// doLegacyOnlyTests tests functionality for Mode 0 (legacy only)
// Only legacy API should be used, no K8s API interaction
func doLegacyOnlyTests(t *testing.T, helper *apis.K8sTestHelper) {
	client := helper.GetResourceClient(apis.ResourceClientArgs{
		User: helper.Org1.Admin,
		GVR:  gvr,
	})

	t.Run("Legacy API CRUD", func(t *testing.T) {
		// Create via legacy API
		legacyPayload := `{
			"text": "Test annotation from legacy API",
			"time": 1609459200000,
			"tags": ["test", "legacy"]
		}`
		legacyCreate := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodPost,
			Path:   "/api/annotations",
			Body:   []byte(legacyPayload),
		}, &map[string]any{})
		require.NotNil(t, legacyCreate.Result)
		require.Equal(t, http.StatusOK, legacyCreate.Response.StatusCode)

		result := *legacyCreate.Result
		id, ok := result["id"].(float64)
		require.True(t, ok, "id should be a number")
		require.Greater(t, id, float64(0), "id should be positive")

		annotationID := int64(id)

		// Read via legacy API
		legacyGet := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodGet,
			Path:   fmt.Sprintf("/api/annotations/%d", annotationID),
		}, &annotations.ItemDTO{})
		require.NotNil(t, legacyGet.Result)
		require.Equal(t, http.StatusOK, legacyGet.Response.StatusCode)
		assert.Equal(t, annotationID, legacyGet.Result.ID)
		assert.Equal(t, "Test annotation from legacy API", legacyGet.Result.Text)

		// Update via legacy API
		updatePayload := `{
			"text": "Updated annotation text",
			"time": 1609459200000,
			"tags": ["test", "updated"]
		}`
		legacyUpdate := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodPut,
			Path:   fmt.Sprintf("/api/annotations/%d", annotationID),
			Body:   []byte(updatePayload),
		}, &map[string]any{})
		require.Equal(t, http.StatusOK, legacyUpdate.Response.StatusCode)

		// Verify update
		verifyGet := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodGet,
			Path:   fmt.Sprintf("/api/annotations/%d", annotationID),
		}, &annotations.ItemDTO{})
		require.NotNil(t, verifyGet.Result)
		assert.Equal(t, "Updated annotation text", verifyGet.Result.Text)

		// Delete via legacy API
		legacyDelete := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodDelete,
			Path:   fmt.Sprintf("/api/annotations/%d", annotationID),
		}, (*any)(nil))
		require.Equal(t, http.StatusOK, legacyDelete.Response.StatusCode)

		// Verify deletion
		verifyDeleted := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodGet,
			Path:   fmt.Sprintf("/api/annotations/%d", annotationID),
		}, (*any)(nil))
		require.Equal(t, http.StatusNotFound, verifyDeleted.Response.StatusCode)
	})
}

// doDualWriteTests tests functionality for Modes 1-4 (dual write modes)
// Both APIs available with cross-API visibility
func doDualWriteTests(t *testing.T, helper *apis.K8sTestHelper, mode grafanarest.DualWriterMode) {
	// Check if annotation K8s APIs are available
	hasAnnotationAPI := checkAnnotationAPIAvailable(t, helper)
	if !hasAnnotationAPI {
		t.Log("Annotation Kubernetes APIs not available - skipping K8s API tests")
		return
	}

	t.Run("Legacy API -> K8s API visibility", func(t *testing.T) {
		client := helper.GetResourceClient(apis.ResourceClientArgs{
			User: helper.Org1.Admin,
			GVR:  gvr,
		})

		// Create via legacy API
		legacyPayload := `{
			"text": "Dual write test annotation",
			"time": 1609459200000,
			"tags": ["test", "dual-write"]
		}`
		legacyCreate := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodPost,
			Path:   "/api/annotations",
			Body:   []byte(legacyPayload),
		}, &map[string]any{})
		require.NotNil(t, legacyCreate.Result)
		require.Equal(t, http.StatusOK, legacyCreate.Response.StatusCode)

		result := *legacyCreate.Result
		id := int64(result["id"].(float64))
		require.Greater(t, id, int64(0))

		name := fmt.Sprintf("a-%d", id)

		// Should be visible via K8s API
		found, err := client.Resource.Get(context.Background(), name, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, name, found.GetName())
		assert.LessOrEqual(t, time.Since(found.GetCreationTimestamp().Time).Seconds(), 30.0, "creation timestamp should be within last 30 seconds")

		// Verify cross-API consistency
		getFromBothAPIs(t, helper, client, id)

		// Clean up
		err = client.Resource.Delete(context.Background(), name, metav1.DeleteOptions{})
		require.NoError(t, err)
	})

	t.Run("K8s API -> Legacy API visibility", func(t *testing.T) {
		client := helper.GetResourceClient(apis.ResourceClientArgs{
			User: helper.Org1.Admin,
			GVR:  gvr,
		})

		// Create via K8s API
		obj := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodPost,
			Path:   fmt.Sprintf("/apis/%s/%s/namespaces/default/annotations", annotationV0.APIGroup, annotationV0.APIVersion),
			Body: []byte(`{
				"metadata": { "generateName": "a-" },
				"spec": {
					"text": "K8s API created annotation",
					"time": 1609459200000,
					"tags": ["test", "k8s-created"]
				}
			}`),
		}, &unstructured.Unstructured{})
		require.NotNil(t, obj.Result)
		require.Equal(t, http.StatusCreated, obj.Response.StatusCode)

		name := obj.Result.GetName()
		assert.NotEmpty(t, name)

		// Parse ID from name
		var id int64
		_, err := fmt.Sscanf(name, "a-%d", &id)
		require.NoError(t, err)

		// Should be visible via legacy API
		legacyAnnotation := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodGet,
			Path:   fmt.Sprintf("/api/annotations/%d", id),
		}, &annotations.ItemDTO{})
		require.NotNil(t, legacyAnnotation.Result)
		assert.Equal(t, id, legacyAnnotation.Result.ID)
		assert.Equal(t, "K8s API created annotation", legacyAnnotation.Result.Text)

		// Verify cross-API consistency
		getFromBothAPIs(t, helper, client, id)

		// Clean up
		err = client.Resource.Delete(context.Background(), name, metav1.DeleteOptions{})
		require.NoError(t, err)
	})
}

// doUnifiedOnlyTests tests functionality for Mode 5 (unified only)
// Only K8s API, no legacy API interaction
func doUnifiedOnlyTests(t *testing.T, helper *apis.K8sTestHelper) {
	// Check if annotation K8s APIs are available
	hasAnnotationAPI := checkAnnotationAPIAvailable(t, helper)
	if !hasAnnotationAPI {
		t.Log("Annotation Kubernetes APIs not available - skipping K8s API tests")
		return
	}

	t.Run("K8s API CRUD (unified storage only)", func(t *testing.T) {
		client := helper.GetResourceClient(apis.ResourceClientArgs{
			User: helper.Org1.Admin,
			GVR:  gvr,
		})

		// Create via K8s API
		obj := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodPost,
			Path:   fmt.Sprintf("/apis/%s/%s/namespaces/default/annotations", annotationV0.APIGroup, annotationV0.APIVersion),
			Body: []byte(`{
				"metadata": { "generateName": "a-" },
				"spec": {
					"text": "Unified storage test annotation",
					"time": 1609459200000,
					"tags": ["test", "unified"]
				}
			}`),
		}, &unstructured.Unstructured{})
		require.NotNil(t, obj.Result)
		require.Equal(t, http.StatusCreated, obj.Response.StatusCode)

		name := obj.Result.GetName()
		assert.NotEmpty(t, name)

		// Read via K8s API
		found, err := client.Resource.Get(context.Background(), name, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, name, found.GetName())

		spec, ok := found.Object["spec"].(map[string]any)
		require.True(t, ok)
		assert.Equal(t, "Unified storage test annotation", spec["text"])

		// Update via K8s API
		spec["text"] = "Updated unified annotation"
		found.Object["spec"] = spec
		updated, err := client.Resource.Update(context.Background(), found, metav1.UpdateOptions{})
		require.NoError(t, err)

		// Verify update
		updatedSpec, _ := updated.Object["spec"].(map[string]any)
		assert.Equal(t, "Updated unified annotation", updatedSpec["text"])

		// Delete via K8s API
		err = client.Resource.Delete(context.Background(), name, metav1.DeleteOptions{})
		require.NoError(t, err)

		// Verify deletion
		_, err = client.Resource.Get(context.Background(), name, metav1.GetOptions{})
		require.Error(t, err)
	})

	t.Run("K8s API validation - invalid data", func(t *testing.T) {
		client := helper.GetResourceClient(apis.ResourceClientArgs{
			User: helper.Org1.Admin,
			GVR:  gvr,
		})

		// Attempt to create annotation without required text field
		response := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodPost,
			Path:   fmt.Sprintf("/apis/%s/%s/namespaces/default/annotations", annotationV0.APIGroup, annotationV0.APIVersion),
			Body: []byte(`{
				"metadata": { "generateName": "a-" },
				"spec": {
					"time": 1609459200000
				}
			}`),
		}, (*unstructured.Unstructured)(nil))

		// Should get a validation error
		assert.NotEqual(t, http.StatusCreated, response.Response.StatusCode,
			"Expected error for annotation without text field")
	})

	t.Run("K8s API List with field selectors", func(t *testing.T) {
		client := helper.GetResourceClient(apis.ResourceClientArgs{
			User: helper.Org1.Admin,
			GVR:  gvr,
		})

		// Create test annotations with different dashboard UIDs
		for i, dashUID := range []string{"dash-1", "dash-2"} {
			obj := apis.DoRequest(helper, apis.RequestParams{
				User:   client.Args.User,
				Method: http.MethodPost,
				Path:   fmt.Sprintf("/apis/%s/%s/namespaces/default/annotations", annotationV0.APIGroup, annotationV0.APIVersion),
				Body: []byte(fmt.Sprintf(`{
					"metadata": { "generateName": "a-" },
					"spec": {
						"text": "Test annotation %d",
						"time": 1609459200000,
						"dashboardUID": "%s"
					}
				}`, i, dashUID)),
			}, &unstructured.Unstructured{})
			require.NotNil(t, obj.Result)
			require.Equal(t, http.StatusCreated, obj.Response.StatusCode)
		}

		// List with field selector for specific dashboard
		list, err := client.Resource.List(context.Background(), metav1.ListOptions{
			FieldSelector: "spec.dashboardUID=dash-1",
		})
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(list.Items), 1, "Should find at least one annotation for dash-1")

		// Verify all returned annotations have the correct dashboard UID
		for _, item := range list.Items {
			spec, _ := item.Object["spec"].(map[string]any)
			assert.Equal(t, "dash-1", spec["dashboardUID"])
		}
	})
}

// Helper function to check if annotation K8s APIs are available
func checkAnnotationAPIAvailable(t *testing.T, helper *apis.K8sTestHelper) bool {
	disco := helper.NewDiscoveryClient()
	groups, err := disco.ServerGroups()
	if err != nil {
		t.Logf("Failed to get server groups: %v", err)
		return false
	}

	for _, group := range groups.Groups {
		if group.Name == annotationV0.APIGroup {
			return true
		}
	}
	return false
}

// getFromBothAPIs does a get with both k8s and legacy API, and verifies the results are the same
func getFromBothAPIs(t *testing.T,
	helper *apis.K8sTestHelper,
	client *apis.K8sResourceClient,
	id int64,
) {
	t.Helper()

	name := fmt.Sprintf("a-%d", id)
	k8sResource, err := client.Resource.Get(context.Background(), name, metav1.GetOptions{})
	require.NoError(t, err)
	assert.Equal(t, name, k8sResource.GetName())

	// Legacy API: Get the annotation
	legacyAnnotation := apis.DoRequest(helper, apis.RequestParams{
		User:   client.Args.User,
		Method: http.MethodGet,
		Path:   fmt.Sprintf("/api/annotations/%d", id),
	}, &annotations.ItemDTO{})

	if legacyAnnotation.Result != nil {
		// If legacy API returns data, verify consistency
		spec, ok := k8sResource.Object["spec"].(map[string]any)
		require.True(t, ok)
		assert.Equal(t, legacyAnnotation.Result.ID, id)
		assert.Equal(t, legacyAnnotation.Result.Text, spec["text"].(string))
	}
}
