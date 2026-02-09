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

func TestIntegrationCorrelations(t *testing.T) {
	testutil.SkipIntegrationTestInShortMode(t)

	for _, mode := range []grafanarest.DualWriterMode{
		grafanarest.Mode0, // Only legacy for now
		// grafanarest.Mode2,
		// grafanarest.Mode3,
		// grafanarest.Mode5,
	} {
		t.Run(fmt.Sprintf("correlations (mode:%d)", mode), func(t *testing.T) {
			helper := apis.NewK8sTestHelper(t, testinfra.GrafanaOpts{
				DisableAnonymous:     true,
				EnableFeatureToggles: []string{featuremgmt.FlagKubernetesCorrelations},
				UnifiedStorageConfig: map[string]setting.UnifiedStorageConfig{
					"correlation.correlations.grafana.app": {
						DualWriterMode: mode,
					},
				},
			})

			// Create test data sources
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
			helper.CreateDS(&datasources.AddDataSourceCommand{
				OrgID: helper.Org1.OrgID,
				Name:  "test-C",
				UID:   "test-C",
				Type:  "testdata",
			})

			ctx := context.Background()
			correlationsClient := helper.GetResourceClient(apis.ResourceClientArgs{
				User: helper.Org1.Admin,
				GVR:  gvr,
			})

			// Test: Create correlation via legacy API
			cmd := &correlations.CreateCorrelationCommand{
				TargetUID:   ptr.To("test-B"),
				Label:       "create-get-test",
				Description: "description for create-get",
				Type:        correlations.CorrelationType("query"),
				Config: correlations.CorrelationConfig{
					Field:  "message",
					Target: map[string]any{},
					Transformations: correlations.Transformations{{
						Type:       "logfmt",
						Expression: "",
						Field:      "field",
						MapValue:   "value",
					}},
				},
			}
			body, err := json.Marshal(cmd)
			require.NoError(t, err)

			createAtoB := apis.DoRequest(helper, apis.RequestParams{
				User:   correlationsClient.Args.User,
				Method: http.MethodPost,
				Path:   "/api/datasources/uid/test-A/correlations",
				Body:   body,
			}, &correlations.CreateCorrelationResponseBody{})
			require.Equal(t, http.StatusOK, createAtoB.Response.StatusCode, "create correlation")
			require.NotEmpty(t, createAtoB.Result.Result.UID, "a to b")
			uidAtoB := createAtoB.Result.Result.UID

			// Test: List correlations via K8s API
			listResults, err := correlationsClient.Resource.List(ctx, metav1.ListOptions{})
			require.NoError(t, err)
			require.Len(t, listResults.Items, 1)
			require.Equal(t, uidAtoB, listResults.Items[0].GetName())

			// Test: Get correlation via K8s API
			getResults, err := correlationsClient.Resource.Get(ctx, uidAtoB, metav1.GetOptions{})
			require.NoError(t, err)
			require.Equal(t, uidAtoB, getResults.GetName())

			// Verify spec fields
			spec, found, err := unstructured.NestedMap(getResults.Object, "spec")
			require.NoError(t, err)
			require.True(t, found)
			require.Equal(t, "create-get-test", spec["label"])
			require.Equal(t, "query", spec["type"])

			// Test: Update correlation via K8s API
			err = unstructured.SetNestedField(getResults.Object, "updated-label", "spec", "label")
			require.NoError(t, err)
			err = unstructured.SetNestedField(getResults.Object, "updated description", "spec", "description")
			require.NoError(t, err)

			updated, err := correlationsClient.Resource.Update(ctx, getResults, metav1.UpdateOptions{})
			require.NoError(t, err)
			require.Equal(t, uidAtoB, updated.GetName())

			// Verify the update via K8s API
			getAfterUpdate, err := correlationsClient.Resource.Get(ctx, uidAtoB, metav1.GetOptions{})
			require.NoError(t, err)
			specAfterUpdate, _, _ := unstructured.NestedMap(getAfterUpdate.Object, "spec")
			assert.Equal(t, "updated-label", specAfterUpdate["label"])
			assert.Equal(t, "updated description", specAfterUpdate["description"])

			// Verify update is visible via legacy API (cross-API consistency)
			legacyGet := apis.DoRequest(helper, apis.RequestParams{
				User:   correlationsClient.Args.User,
				Method: http.MethodGet,
				Path:   fmt.Sprintf("/api/datasources/uid/test-A/correlations/%s", uidAtoB),
			}, &correlations.Correlation{})
			require.Equal(t, http.StatusOK, legacyGet.Response.StatusCode)
			require.NotNil(t, legacyGet.Result)
			assert.Equal(t, "updated-label", legacyGet.Result.Label)
			assert.Equal(t, "updated description", legacyGet.Result.Description)

			// Test: Create correlations from different sources for filtering test
			cmdFromC := &correlations.CreateCorrelationCommand{
				TargetUID:   ptr.To("test-B"),
				Label:       "from-C",
				Description: "correlation from C",
				Type:        correlations.CorrelationType("query"),
				Config: correlations.CorrelationConfig{
					Field:  "message",
					Target: map[string]any{},
				},
			}
			bodyFromC, _ := json.Marshal(cmdFromC)
			createFromC := apis.DoRequest(helper, apis.RequestParams{
				User:   correlationsClient.Args.User,
				Method: http.MethodPost,
				Path:   "/api/datasources/uid/test-C/correlations",
				Body:   bodyFromC,
			}, &correlations.CreateCorrelationResponseBody{})
			require.Equal(t, http.StatusOK, createFromC.Response.StatusCode)
			uidFromC := createFromC.Result.Result.UID

			// Test: List correlations filtered by source via legacy API
			// The endpoint /api/datasources/uid/:uid/correlations returns []Correlation
			listFromA := apis.DoRequest(helper, apis.RequestParams{
				User:   correlationsClient.Args.User,
				Method: http.MethodGet,
				Path:   "/api/datasources/uid/test-A/correlations",
			}, &[]correlations.Correlation{})
			require.Equal(t, http.StatusOK, listFromA.Response.StatusCode, "list from A status")
			require.NotNil(t, listFromA.Result)

			// Should contain correlations from test-A but not from test-C
			foundFromA := false
			foundFromC := false
			for _, c := range *listFromA.Result {
				if c.UID == uidAtoB {
					foundFromA = true
				}
				if c.UID == uidFromC {
					foundFromC = true
				}
			}
			assert.True(t, foundFromA, "correlation from test-A should be found when listing from test-A")
			assert.False(t, foundFromC, "correlation from test-C should NOT be found when listing from test-A")

			// List correlations from test-C
			listFromC := apis.DoRequest(helper, apis.RequestParams{
				User:   correlationsClient.Args.User,
				Method: http.MethodGet,
				Path:   "/api/datasources/uid/test-C/correlations",
			}, &[]correlations.Correlation{})
			require.Equal(t, http.StatusOK, listFromC.Response.StatusCode, "list from C status")
			require.NotNil(t, listFromC.Result)

			foundFromA = false
			foundFromC = false
			for _, c := range *listFromC.Result {
				if c.UID == uidAtoB {
					foundFromA = true
				}
				if c.UID == uidFromC {
					foundFromC = true
				}
			}
			assert.False(t, foundFromA, "correlation from test-A should NOT be found when listing from test-C")
			assert.True(t, foundFromC, "correlation from test-C should be found when listing from test-C")

			// Test: Delete correlation via legacy API and verify via K8s API
			deleteFromC := apis.DoRequest(helper, apis.RequestParams{
				User:   correlationsClient.Args.User,
				Method: http.MethodDelete,
				Path:   fmt.Sprintf("/api/datasources/uid/test-C/correlations/%s", uidFromC),
			}, &correlations.DeleteCorrelationResponseBody{})
			require.Equal(t, http.StatusOK, deleteFromC.Response.StatusCode)

			// Verify deletion via legacy API - should return 404
			legacyGetDeleted := apis.DoRequest(helper, apis.RequestParams{
				User:   correlationsClient.Args.User,
				Method: http.MethodGet,
				Path:   fmt.Sprintf("/api/datasources/uid/test-C/correlations/%s", uidFromC),
			}, &correlations.Correlation{})
			assert.Equal(t, http.StatusNotFound, legacyGetDeleted.Response.StatusCode, "deleted correlation should not be found via legacy API")

			// Verify deletion via K8s List - should not contain the deleted correlation
			listAfterDelete, err := correlationsClient.Resource.List(ctx, metav1.ListOptions{})
			require.NoError(t, err)
			foundDeletedInList := false
			for _, item := range listAfterDelete.Items {
				if item.GetName() == uidFromC {
					foundDeletedInList = true
				}
			}
			assert.False(t, foundDeletedInList, "deleted correlation should not be found in K8s list")

			// Test: Pagination with continue token
			// Create additional correlations for pagination test
			var paginationUIDs []string
			paginationUIDs = append(paginationUIDs, uidAtoB) // Include the first correlation

			for i := 0; i < 5; i++ {
				cmdPagination := &correlations.CreateCorrelationCommand{
					TargetUID:   ptr.To("test-B"),
					Label:       fmt.Sprintf("pagination-test-%d", i),
					Description: fmt.Sprintf("pagination test %d", i),
					Type:        correlations.CorrelationType("query"),
					Config: correlations.CorrelationConfig{
						Field:  "message",
						Target: map[string]any{},
					},
				}
				bodyPagination, _ := json.Marshal(cmdPagination)
				createPagination := apis.DoRequest(helper, apis.RequestParams{
					User:   correlationsClient.Args.User,
					Method: http.MethodPost,
					Path:   "/api/datasources/uid/test-A/correlations",
					Body:   bodyPagination,
				}, &correlations.CreateCorrelationResponseBody{})
				require.Equal(t, http.StatusOK, createPagination.Response.StatusCode)
				paginationUIDs = append(paginationUIDs, createPagination.Result.Result.UID)
			}

			// Verify all correlations were created (6 total: 1 initial + 5 pagination)
			allItems, err := correlationsClient.Resource.List(ctx, metav1.ListOptions{})
			require.NoError(t, err)
			require.Equal(t, 6, len(allItems.Items), "should have exactly 6 correlations")

			// Test pagination with continue token
			// List with limit of 2 to force pagination
			firstPage, err := correlationsClient.Resource.List(ctx, metav1.ListOptions{
				Limit: 2,
			})
			require.NoError(t, err)
			assert.Equal(t, 2, len(firstPage.Items), "first page should have exactly 2 items")

			// Continue token should be set when there are more items
			assert.NotEmpty(t, firstPage.GetContinue(), "continue token should be set when there are more items")

			// Fetch next page using continue token - verify it returns items
			if firstPage.GetContinue() != "" {
				secondPage, err := correlationsClient.Resource.List(ctx, metav1.ListOptions{
					Limit:    2,
					Continue: firstPage.GetContinue(),
				})
				require.NoError(t, err)
				assert.Equal(t, 2, len(secondPage.Items), "second page should have exactly 2 items")

				// Fetch third page if there's more
				if secondPage.GetContinue() != "" {
					thirdPage, err := correlationsClient.Resource.List(ctx, metav1.ListOptions{
						Limit:    2,
						Continue: secondPage.GetContinue(),
					})
					require.NoError(t, err)
					assert.Equal(t, 2, len(thirdPage.Items), "third page should have exactly 2 items")
				}
			}

			// Clean up all correlations using legacy API
			for _, uid := range paginationUIDs {
				apis.DoRequest(helper, apis.RequestParams{
					User:   correlationsClient.Args.User,
					Method: http.MethodDelete,
					Path:   fmt.Sprintf("/api/datasources/uid/test-A/correlations/%s", uid),
				}, &correlations.DeleteCorrelationResponseBody{})
			}

			// Verify all are deleted
			finalList, err := correlationsClient.Resource.List(ctx, metav1.ListOptions{})
			require.NoError(t, err)
			assert.Empty(t, finalList.Items, "all correlations should be deleted")
		})
	}
}
