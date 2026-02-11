package correlations

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/utils/ptr"

	correlationsV0 "github.com/grafana/grafana/apps/correlations/pkg/apis/correlation/v0alpha1"
	grafanarest "github.com/grafana/grafana/pkg/apiserver/rest"
	"github.com/grafana/grafana/pkg/services/apiserver/options"
	"github.com/grafana/grafana/pkg/services/correlations"
	"github.com/grafana/grafana/pkg/services/datasources"
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

var gvr = correlationsV0.CorrelationKind().GroupVersionResource()

var RESOURCEGROUP = gvr.GroupResource().String()

func TestIntegrationCorrelations(t *testing.T) {
	testutil.SkipIntegrationTestInShortMode(t)

	t.Run("default setup with k8s flag turned off (legacy APIs)", func(t *testing.T) {
		helper := apis.NewK8sTestHelper(t, testinfra.GrafanaOpts{
			AppModeProduction:    true, // do not start extra port 6443
			DisableAnonymous:     true,
			EnableFeatureToggles: []string{}, // legacy APIs only
		})
		// In this setup, K8s APIs are not available - legacy APIs only
		doLegacyOnlyTests(t, helper)

		// When no feature toggles are enabled, correlations K8s APIs should not be available
		disco := helper.NewDiscoveryClient()
		groups, err := disco.ServerGroups()
		require.NoError(t, err)

		hasCorrelationsGroup := false
		for _, group := range groups.Groups {
			if group.Name == "correlations.grafana.app" {
				hasCorrelationsGroup = true
				break
			}
		}
		require.False(t, hasCorrelationsGroup, "correlations K8s APIs should not be available when kubernetesCorrelations feature toggle is disabled")
	})

	t.Run("with dual write (unified storage, mode 0)", func(t *testing.T) {
		helper := apis.NewK8sTestHelper(t, testinfra.GrafanaOpts{
			AppModeProduction:    false, // required for unified storage
			DisableAnonymous:     true,
			APIServerStorageType: options.StorageTypeUnified,
			EnableFeatureToggles: []string{featuremgmt.FlagKubernetesCorrelations},
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
						featuremgmt.FlagKubernetesCorrelations,
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
				featuremgmt.FlagKubernetesCorrelations,
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

// setupTestDataSources creates test data sources needed for correlation tests
func setupTestDataSources(helper *apis.K8sTestHelper) {
	helper.CreateDS(&datasources.AddDataSourceCommand{
		OrgID: helper.Org1.OrgID,
		Name:  "test-A",
		UID:   "test-A",
		Type:  "testdata",
	})
	helper.CreateDS(&datasources.AddDataSourceCommand{
		OrgID: helper.Org1.OrgID,
		Name:  "test-B",
		UID:   "test-B",
		Type:  "testdata",
	})
}

// createCorrelationViaLegacyAPI creates a correlation via the legacy API and returns the UID
func createCorrelationViaLegacyAPI(t *testing.T, helper *apis.K8sTestHelper, client *apis.K8sResourceClient, sourceUID, targetUID, label, description string) string {
	t.Helper()

	cmd := &correlations.CreateCorrelationCommand{
		TargetUID:   ptr.To(targetUID),
		Label:       label,
		Description: description,
		Type:        correlations.CorrelationType("query"),
		Config: correlations.CorrelationConfig{
			Field:  "message",
			Target: map[string]any{},
			Transformations: correlations.Transformations{{
				Type:       "logfmt",
				Expression: "",
				Field:      "field1",
				MapValue:   "mapped",
			}},
		},
	}
	body, err := json.Marshal(cmd)
	require.NoError(t, err)

	createResponse := apis.DoRequest(helper, apis.RequestParams{
		User:   client.Args.User,
		Method: http.MethodPost,
		Path:   fmt.Sprintf("/api/datasources/uid/%s/correlations", sourceUID),
		Body:   body,
	}, &correlations.CreateCorrelationResponseBody{})
	require.Equal(t, http.StatusOK, createResponse.Response.StatusCode, "create correlation via legacy API")
	require.NotEmpty(t, createResponse.Result.Result.UID)
	return createResponse.Result.Result.UID
}

// doLegacyOnlyTests tests functionality for Mode 0 (legacy only)
// Only legacy API should be used, no K8s API interaction
func doLegacyOnlyTests(t *testing.T, helper *apis.K8sTestHelper) {
	setupTestDataSources(helper)

	client := helper.GetResourceClient(apis.ResourceClientArgs{
		User: helper.Org1.Admin,
		GVR:  gvr,
	})

	t.Run("Legacy API CRUD", func(t *testing.T) {
		// Create via legacy API
		uid := createCorrelationViaLegacyAPI(t, helper, client, "test-A", "test-B", "legacy-test", "Legacy API test correlation")

		// Read via legacy API - get single correlation
		getResponse := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodGet,
			Path:   fmt.Sprintf("/api/datasources/uid/test-A/correlations/%s", uid),
		}, &correlations.Correlation{})
		require.Equal(t, http.StatusOK, getResponse.Response.StatusCode)
		require.NotNil(t, getResponse.Result)
		assert.Equal(t, uid, getResponse.Result.UID)
		assert.Equal(t, "legacy-test", getResponse.Result.Label)
		assert.Equal(t, "Legacy API test correlation", getResponse.Result.Description)

		// Update via legacy API
		updateCmd := &correlations.UpdateCorrelationCommand{
			Label:       ptr.To("updated-label"),
			Description: ptr.To("Updated description"),
		}
		updateBody, err := json.Marshal(updateCmd)
		require.NoError(t, err)

		updateResponse := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodPatch,
			Path:   fmt.Sprintf("/api/datasources/uid/test-A/correlations/%s", uid),
			Body:   updateBody,
		}, &correlations.UpdateCorrelationResponseBody{})
		require.Equal(t, http.StatusOK, updateResponse.Response.StatusCode)
		assert.Equal(t, "updated-label", updateResponse.Result.Result.Label)

		// List via legacy API
		listResponse := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodGet,
			Path:   "/api/datasources/correlations",
		}, &correlations.GetCorrelationsResponseBody{})
		require.Equal(t, http.StatusOK, listResponse.Response.StatusCode)
		require.NotNil(t, listResponse.Result)
		require.GreaterOrEqual(t, len(listResponse.Result.Correlations), 1)

		// Delete via legacy API
		deleteResponse := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodDelete,
			Path:   fmt.Sprintf("/api/datasources/uid/test-A/correlations/%s", uid),
		}, &correlations.DeleteCorrelationResponseBody{})
		require.Equal(t, http.StatusOK, deleteResponse.Response.StatusCode)

		// Verify deletion
		getAfterDelete := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodGet,
			Path:   fmt.Sprintf("/api/datasources/uid/test-A/correlations/%s", uid),
		}, &correlations.Correlation{})
		assert.Equal(t, http.StatusNotFound, getAfterDelete.Response.StatusCode)
	})

	t.Run("Legacy API - Get correlations by source UID", func(t *testing.T) {
		// Create multiple correlations from the same source
		uid1 := createCorrelationViaLegacyAPI(t, helper, client, "test-A", "test-B", "source-test-1", "First correlation from source A")
		uid2 := createCorrelationViaLegacyAPI(t, helper, client, "test-A", "test-B", "source-test-2", "Second correlation from source A")

		// Get correlations by source UID
		getBySourceResponse := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodGet,
			Path:   "/api/datasources/uid/test-A/correlations",
		}, &[]correlations.Correlation{})
		require.Equal(t, http.StatusOK, getBySourceResponse.Response.StatusCode)
		require.NotNil(t, getBySourceResponse.Result)
		require.GreaterOrEqual(t, len(*getBySourceResponse.Result), 2)

		// Clean up
		apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodDelete,
			Path:   fmt.Sprintf("/api/datasources/uid/test-A/correlations/%s", uid1),
		}, &correlations.DeleteCorrelationResponseBody{})
		apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodDelete,
			Path:   fmt.Sprintf("/api/datasources/uid/test-A/correlations/%s", uid2),
		}, &correlations.DeleteCorrelationResponseBody{})
	})

	t.Run("Legacy API - validation errors", func(t *testing.T) {
		// Test missing required field (type)
		invalidCmd := map[string]any{
			"targetUID": "test-B",
			"label":     "invalid",
			"config": map[string]any{
				"field":  "message",
				"target": map[string]any{},
			},
			// Missing type field
		}
		body, err := json.Marshal(invalidCmd)
		require.NoError(t, err)

		createResponse := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodPost,
			Path:   "/api/datasources/uid/test-A/correlations",
			Body:   body,
		}, &correlations.CreateCorrelationResponseBody{})
		assert.Equal(t, http.StatusBadRequest, createResponse.Response.StatusCode, "should reject invalid correlation")
	})
}

// doDualWriteTests tests functionality for Modes 1-4 (dual write modes)
// Both APIs available with cross-API visibility
func doDualWriteTests(t *testing.T, helper *apis.K8sTestHelper, mode grafanarest.DualWriterMode) {
	setupTestDataSources(helper)

	// Check if correlations K8s APIs are available
	hasCorrelationsAPI := checkCorrelationsAPIAvailable(t, helper)
	if !hasCorrelationsAPI {
		t.Log("Correlations Kubernetes APIs not available - skipping K8s API tests")
		return
	}

	t.Run("Legacy API -> K8s API visibility", func(t *testing.T) {
		client := helper.GetResourceClient(apis.ResourceClientArgs{
			User: helper.Org1.Admin,
			GVR:  gvr,
		})

		// Create via legacy API
		uid := createCorrelationViaLegacyAPI(t, helper, client, "test-A", "test-B", "dual-write-test", "Dual write test correlation")

		// Should be visible via K8s API
		found, err := client.Resource.Get(context.Background(), uid, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, uid, found.GetName())

		// Verify cross-API consistency
		getFromBothAPIs(t, helper, client, uid)

		// Clean up via legacy API
		apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodDelete,
			Path:   fmt.Sprintf("/api/datasources/uid/test-A/correlations/%s", uid),
		}, &correlations.DeleteCorrelationResponseBody{})
	})

	t.Run("K8s API -> Legacy API visibility", func(t *testing.T) {
		client := helper.GetResourceClient(apis.ResourceClientArgs{
			User: helper.Org1.Admin,
			GVR:  gvr,
		})

		// Create via K8s API
		k8sPayload := `{
			"metadata": { "generateName": "test-" },
			"spec": {
				"type": "query",
				"source": { "group": "testdata", "name": "test-A" },
				"target": { "group": "testdata", "name": "test-B" },
				"label": "k8s-created",
				"description": "Created via K8s API",
				"config": {
					"field": "message",
					"target": {}
				}
			}
		}`
		obj := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodPost,
			Path:   "/apis/correlations.grafana.app/v0alpha1/namespaces/default/correlations",
			Body:   []byte(k8sPayload),
		}, &unstructured.Unstructured{})
		require.NotNil(t, obj.Result)

		uid := obj.Result.GetName()
		assert.NotEmpty(t, uid)

		// Should be visible via legacy API
		legacyCorrelation := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodGet,
			Path:   fmt.Sprintf("/api/datasources/uid/test-A/correlations/%s", uid),
		}, &correlations.Correlation{}).Result
		require.NotNil(t, legacyCorrelation)
		assert.Equal(t, uid, legacyCorrelation.UID)
		assert.Equal(t, "k8s-created", legacyCorrelation.Label)

		// Verify cross-API consistency
		getFromBothAPIs(t, helper, client, uid)

		// Clean up via K8s API
		err := client.Resource.Delete(context.Background(), uid, metav1.DeleteOptions{})
		require.NoError(t, err)
	})

	t.Run("Update via Legacy API, verify via K8s API", func(t *testing.T) {
		client := helper.GetResourceClient(apis.ResourceClientArgs{
			User: helper.Org1.Admin,
			GVR:  gvr,
		})

		// Create via legacy API
		uid := createCorrelationViaLegacyAPI(t, helper, client, "test-A", "test-B", "update-test", "Original description")

		// Update via legacy API
		updateCmd := &correlations.UpdateCorrelationCommand{
			Label:       ptr.To("updated-via-legacy"),
			Description: ptr.To("Updated via legacy API"),
		}
		updateBody, err := json.Marshal(updateCmd)
		require.NoError(t, err)

		apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodPatch,
			Path:   fmt.Sprintf("/api/datasources/uid/test-A/correlations/%s", uid),
			Body:   updateBody,
		}, &correlations.UpdateCorrelationResponseBody{})

		// Verify via K8s API
		k8sObj, err := client.Resource.Get(context.Background(), uid, metav1.GetOptions{})
		require.NoError(t, err)
		spec, ok := k8sObj.Object["spec"].(map[string]any)
		require.True(t, ok)
		assert.Equal(t, "updated-via-legacy", spec["label"])

		// Clean up
		err = client.Resource.Delete(context.Background(), uid, metav1.DeleteOptions{})
		require.NoError(t, err)
	})

	t.Run("Delete via K8s API, verify via Legacy API", func(t *testing.T) {
		client := helper.GetResourceClient(apis.ResourceClientArgs{
			User: helper.Org1.Admin,
			GVR:  gvr,
		})

		// Create via legacy API
		uid := createCorrelationViaLegacyAPI(t, helper, client, "test-A", "test-B", "delete-test", "To be deleted")

		// Delete via K8s API
		err := client.Resource.Delete(context.Background(), uid, metav1.DeleteOptions{})
		require.NoError(t, err)

		// Verify deletion via legacy API
		getResponse := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodGet,
			Path:   fmt.Sprintf("/api/datasources/uid/test-A/correlations/%s", uid),
		}, &correlations.Correlation{})
		assert.Equal(t, http.StatusNotFound, getResponse.Response.StatusCode)
	})
}

// doUnifiedOnlyTests tests functionality for Mode 5 (unified only)
// Only K8s API, limited legacy API interaction
func doUnifiedOnlyTests(t *testing.T, helper *apis.K8sTestHelper) {
	setupTestDataSources(helper)

	// Check if correlations K8s APIs are available
	hasCorrelationsAPI := checkCorrelationsAPIAvailable(t, helper)
	if !hasCorrelationsAPI {
		t.Log("Correlations Kubernetes APIs not available - skipping K8s API tests")
		return
	}

	t.Run("K8s API CRUD (unified storage only)", func(t *testing.T) {
		client := helper.GetResourceClient(apis.ResourceClientArgs{
			User: helper.Org1.Admin,
			GVR:  gvr,
		})

		// Create via K8s API
		k8sPayload := `{
			"metadata": { "generateName": "unified-" },
			"spec": {
				"type": "query",
				"source": { "group": "testdata", "name": "test-A" },
				"target": { "group": "testdata", "name": "test-B" },
				"label": "unified-only",
				"description": "Created in unified storage only",
				"config": {
					"field": "message",
					"target": {}
				}
			}
		}`
		obj := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodPost,
			Path:   "/apis/correlations.grafana.app/v0alpha1/namespaces/default/correlations",
			Body:   []byte(k8sPayload),
		}, &unstructured.Unstructured{})
		require.NotNil(t, obj.Result)

		uid := obj.Result.GetName()
		assert.NotEmpty(t, uid)

		// Read via K8s API
		found, err := client.Resource.Get(context.Background(), uid, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, uid, found.GetName())

		// Update via K8s API
		found.Object["spec"].(map[string]any)["label"] = "unified-updated"
		_, err = client.Resource.Update(context.Background(), found, metav1.UpdateOptions{})
		require.NoError(t, err)

		// Verify update
		updated, err := client.Resource.Get(context.Background(), uid, metav1.GetOptions{})
		require.NoError(t, err)
		spec, ok := updated.Object["spec"].(map[string]any)
		require.True(t, ok)
		assert.Equal(t, "unified-updated", spec["label"])

		// List via K8s API
		list, err := client.Resource.List(context.Background(), metav1.ListOptions{})
		require.NoError(t, err)
		require.GreaterOrEqual(t, len(list.Items), 1)

		// Delete via K8s API
		err = client.Resource.Delete(context.Background(), uid, metav1.DeleteOptions{})
		require.NoError(t, err)

		// Verify deletion
		_, err = client.Resource.Get(context.Background(), uid, metav1.GetOptions{})
		assert.Error(t, err)
	})

	t.Run("K8s API - correlation types", func(t *testing.T) {
		client := helper.GetResourceClient(apis.ResourceClientArgs{
			User: helper.Org1.Admin,
			GVR:  gvr,
		})

		// Test query type correlation
		queryPayload := `{
			"metadata": { "generateName": "query-type-" },
			"spec": {
				"type": "query",
				"source": { "group": "testdata", "name": "test-A" },
				"target": { "group": "testdata", "name": "test-B" },
				"label": "query-correlation",
				"config": {
					"field": "message",
					"target": { "refId": "A" }
				}
			}
		}`
		queryObj := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodPost,
			Path:   "/apis/correlations.grafana.app/v0alpha1/namespaces/default/correlations",
			Body:   []byte(queryPayload),
		}, &unstructured.Unstructured{})
		require.NotNil(t, queryObj.Result)
		queryUID := queryObj.Result.GetName()

		// Verify query type
		found, err := client.Resource.Get(context.Background(), queryUID, metav1.GetOptions{})
		require.NoError(t, err)
		spec, ok := found.Object["spec"].(map[string]any)
		require.True(t, ok)
		assert.Equal(t, "query", spec["type"])

		// Clean up
		err = client.Resource.Delete(context.Background(), queryUID, metav1.DeleteOptions{})
		require.NoError(t, err)

		// Test external type correlation
		externalPayload := `{
			"metadata": { "generateName": "external-type-" },
			"spec": {
				"type": "external",
				"source": { "group": "testdata", "name": "test-A" },
				"label": "external-correlation",
				"config": {
					"field": "url",
					"target": { "url": "https://example.com" }
				}
			}
		}`
		externalObj := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodPost,
			Path:   "/apis/correlations.grafana.app/v0alpha1/namespaces/default/correlations",
			Body:   []byte(externalPayload),
		}, &unstructured.Unstructured{})
		require.NotNil(t, externalObj.Result)
		externalUID := externalObj.Result.GetName()

		// Verify external type
		found, err = client.Resource.Get(context.Background(), externalUID, metav1.GetOptions{})
		require.NoError(t, err)
		spec, ok = found.Object["spec"].(map[string]any)
		require.True(t, ok)
		assert.Equal(t, "external", spec["type"])

		// Clean up
		err = client.Resource.Delete(context.Background(), externalUID, metav1.DeleteOptions{})
		require.NoError(t, err)
	})

	t.Run("K8s API - transformations", func(t *testing.T) {
		client := helper.GetResourceClient(apis.ResourceClientArgs{
			User: helper.Org1.Admin,
			GVR:  gvr,
		})

		// Create correlation with transformations
		payloadWithTransformations := `{
			"metadata": { "generateName": "transform-" },
			"spec": {
				"type": "query",
				"source": { "group": "testdata", "name": "test-A" },
				"target": { "group": "testdata", "name": "test-B" },
				"label": "with-transformations",
				"config": {
					"field": "message",
					"target": {},
					"transformations": [
						{
							"type": "regex",
							"expression": "(\\w+)",
							"field": "extracted",
							"mapValue": "value"
						},
						{
							"type": "logfmt",
							"expression": "",
							"field": "parsed",
							"mapValue": "result"
						}
					]
				}
			}
		}`
		obj := apis.DoRequest(helper, apis.RequestParams{
			User:   client.Args.User,
			Method: http.MethodPost,
			Path:   "/apis/correlations.grafana.app/v0alpha1/namespaces/default/correlations",
			Body:   []byte(payloadWithTransformations),
		}, &unstructured.Unstructured{})
		require.NotNil(t, obj.Result)
		uid := obj.Result.GetName()

		// Verify transformations
		found, err := client.Resource.Get(context.Background(), uid, metav1.GetOptions{})
		require.NoError(t, err)
		spec, ok := found.Object["spec"].(map[string]any)
		require.True(t, ok)
		config, ok := spec["config"].(map[string]any)
		require.True(t, ok)
		transformations, ok := config["transformations"].([]any)
		require.True(t, ok)
		assert.Len(t, transformations, 2)

		// Clean up
		err = client.Resource.Delete(context.Background(), uid, metav1.DeleteOptions{})
		require.NoError(t, err)
	})
}

// Helper function to check if correlations K8s APIs are available
func checkCorrelationsAPIAvailable(t *testing.T, helper *apis.K8sTestHelper) bool {
	disco := helper.NewDiscoveryClient()
	groups, err := disco.ServerGroups()
	if err != nil {
		t.Logf("Failed to get server groups: %v", err)
		return false
	}

	for _, group := range groups.Groups {
		if group.Name == "correlations.grafana.app" {
			return true
		}
	}
	return false
}

// getFromBothAPIs verifies consistency between K8s and legacy APIs
func getFromBothAPIs(t *testing.T, helper *apis.K8sTestHelper, client *apis.K8sResourceClient, uid string) {
	t.Helper()

	// Get via K8s API
	k8sResource, err := client.Resource.Get(context.Background(), uid, metav1.GetOptions{})
	require.NoError(t, err)
	assert.Equal(t, uid, k8sResource.GetName())

	// Get via Legacy API
	legacyCorrelation := apis.DoRequest(helper, apis.RequestParams{
		User:   client.Args.User,
		Method: http.MethodGet,
		Path:   fmt.Sprintf("/api/datasources/uid/test-A/correlations/%s", uid),
	}, &correlations.Correlation{}).Result

	if legacyCorrelation != nil {
		// Verify consistency between APIs
		spec, ok := k8sResource.Object["spec"].(map[string]any)
		require.True(t, ok)

		assert.Equal(t, legacyCorrelation.UID, k8sResource.GetName(), "UID should match")
		assert.Equal(t, legacyCorrelation.Label, spec["label"], "Label should match")

		// Check description if present
		if legacyCorrelation.Description != "" {
			assert.Equal(t, legacyCorrelation.Description, spec["description"], "Description should match")
		}

		// Check source
		source, ok := spec["source"].(map[string]any)
		require.True(t, ok)
		assert.Equal(t, legacyCorrelation.SourceUID, source["name"], "Source UID should match")

		// Check target if present
		if legacyCorrelation.TargetUID != nil {
			target, ok := spec["target"].(map[string]any)
			require.True(t, ok)
			assert.Equal(t, *legacyCorrelation.TargetUID, target["name"], "Target UID should match")
		}
	}
}
