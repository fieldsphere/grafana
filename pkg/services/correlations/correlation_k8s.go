package correlations

import (
	"encoding/json"
	"fmt"
	"net/http"

	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"

	correlationsV0 "github.com/grafana/grafana/apps/correlations/pkg/apis/correlation/v0alpha1"
	"github.com/grafana/grafana/pkg/api/response"
	grafanaapiserver "github.com/grafana/grafana/pkg/services/apiserver"
	"github.com/grafana/grafana/pkg/services/apiserver/endpoints/request"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/datasources"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

// correlationK8sHandler handles routing correlation API requests to the K8s Resource API
type correlationK8sHandler struct {
	namespacer           request.NamespaceMapper
	gvr                  schema.GroupVersionResource
	clientConfigProvider grafanaapiserver.DirectRestConfigProvider
	dataSourceService    datasources.DataSourceService
}

func newCorrelationK8sHandler(
	cfg *setting.Cfg,
	clientConfigProvider grafanaapiserver.DirectRestConfigProvider,
	dataSourceService datasources.DataSourceService,
) *correlationK8sHandler {
	return &correlationK8sHandler{
		gvr: schema.GroupVersionResource{
			Group:    correlationsV0.APIGroup,
			Version:  correlationsV0.APIVersion,
			Resource: "correlations",
		},
		namespacer:           request.GetNamespaceMapper(cfg),
		clientConfigProvider: clientConfigProvider,
		dataSourceService:    dataSourceService,
	}
}

// getCorrelationsHandler routes GET /api/datasources/correlations to the Resource API
func (ck8s *correlationK8sHandler) getCorrelationsHandler(c *contextmodel.ReqContext) response.Response {
	client, ok := ck8s.getClient(c)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Failed to get client", nil)
	}

	// Build list options from query parameters
	listOpts := v1.ListOptions{}

	limit := c.QueryInt64("limit")
	if limit <= 0 {
		limit = 100
	} else if limit > 1000 {
		limit = 1000
	}
	listOpts.Limit = limit

	// Apply source UID filters if provided
	sourceUIDs := c.QueryStrings("sourceUID")
	if len(sourceUIDs) > 0 {
		// Field selectors for source filtering
		fieldSelectors := []string{}
		for _, sourceUID := range sourceUIDs {
			fieldSelectors = append(fieldSelectors, fmt.Sprintf("spec.source.name=%s", sourceUID))
		}
		if len(fieldSelectors) > 0 {
			listOpts.FieldSelector = joinFieldSelectors(fieldSelectors)
		}
	}

	list, err := client.List(c.Req.Context(), listOpts)
	if err != nil {
		return ck8s.handleError(err)
	}

	// Convert to legacy format
	correlations := make([]Correlation, 0, len(list.Items))
	for _, item := range list.Items {
		corr := ck8s.unstructuredToLegacyCorrelation(item)
		if corr != nil {
			correlations = append(correlations, *corr)
		}
	}

	return response.JSON(http.StatusOK, GetCorrelationsResponseBody{
		Correlations: correlations,
		TotalCount:   int64(len(correlations)),
		Page:         c.QueryInt64("page"),
		Limit:        limit,
	})
}

// getCorrelationsBySourceUIDHandler routes GET /api/datasources/uid/:uid/correlations to the Resource API
func (ck8s *correlationK8sHandler) getCorrelationsBySourceUIDHandler(c *contextmodel.ReqContext) response.Response {
	sourceUID := web.Params(c.Req)[":uid"]
	if sourceUID == "" {
		return response.Error(http.StatusBadRequest, "Source UID is required", nil)
	}

	client, ok := ck8s.getClient(c)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Failed to get client", nil)
	}

	// Filter by source UID
	listOpts := v1.ListOptions{
		FieldSelector: fmt.Sprintf("spec.source.name=%s", sourceUID),
	}

	list, err := client.List(c.Req.Context(), listOpts)
	if err != nil {
		return ck8s.handleError(err)
	}

	if len(list.Items) == 0 {
		return response.Error(http.StatusNotFound, "No correlation found", ErrCorrelationNotFound)
	}

	// Convert to legacy format
	correlations := make([]Correlation, 0, len(list.Items))
	for _, item := range list.Items {
		corr := ck8s.unstructuredToLegacyCorrelation(item)
		if corr != nil {
			correlations = append(correlations, *corr)
		}
	}

	return response.JSON(http.StatusOK, correlations)
}

// getCorrelationHandler routes GET /api/datasources/uid/:uid/correlations/:correlationUID to the Resource API
func (ck8s *correlationK8sHandler) getCorrelationHandler(c *contextmodel.ReqContext) response.Response {
	correlationUID := web.Params(c.Req)[":correlationUID"]
	if correlationUID == "" {
		return response.Error(http.StatusBadRequest, "Correlation UID is required", nil)
	}

	client, ok := ck8s.getClient(c)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Failed to get client", nil)
	}

	out, err := client.Get(c.Req.Context(), correlationUID, v1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			return response.Error(http.StatusNotFound, "Correlation not found", ErrCorrelationNotFound)
		}
		return ck8s.handleError(err)
	}

	corr := ck8s.unstructuredToLegacyCorrelation(*out)
	if corr == nil {
		return response.Error(http.StatusInternalServerError, "Failed to convert correlation", nil)
	}

	return response.JSON(http.StatusOK, corr)
}

// createHandler routes POST /api/datasources/uid/:uid/correlations to the Resource API
func (ck8s *correlationK8sHandler) createHandler(c *contextmodel.ReqContext) response.Response {
	cmd := CreateCorrelationCommand{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	cmd.SourceUID = web.Params(c.Req)[":uid"]
	cmd.OrgId = c.GetOrgID()

	if err := cmd.Validate(); err != nil {
		return response.Error(http.StatusBadRequest, err.Error(), err)
	}

	client, ok := ck8s.getClient(c)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Failed to get client", nil)
	}

	// Get source datasource to determine the group (plugin type)
	sourceDS, err := ck8s.dataSourceService.GetDataSource(c.Req.Context(), &datasources.GetDataSourceQuery{
		UID:   cmd.SourceUID,
		OrgID: cmd.OrgId,
	})
	if err != nil {
		return response.Error(http.StatusNotFound, "Source data source not found", ErrSourceDataSourceDoesNotExists)
	}

	// Get target datasource if provided
	var targetDS *datasources.DataSource
	if cmd.TargetUID != nil && *cmd.TargetUID != "" {
		targetDS, err = ck8s.dataSourceService.GetDataSource(c.Req.Context(), &datasources.GetDataSourceQuery{
			UID:   *cmd.TargetUID,
			OrgID: cmd.OrgId,
		})
		if err != nil {
			return response.Error(http.StatusNotFound, "Target data source not found", ErrTargetDataSourceDoesNotExists)
		}
	}

	obj := ck8s.legacyCreateToUnstructured(cmd, sourceDS, targetDS)
	obj.SetGenerateName("c-") // prefix for generated name

	out, err := client.Create(c.Req.Context(), &obj, v1.CreateOptions{})
	if err != nil {
		return ck8s.handleError(err)
	}

	correlation := ck8s.unstructuredToLegacyCorrelation(*out)
	if correlation == nil {
		return response.Error(http.StatusInternalServerError, "Failed to convert correlation", nil)
	}

	return response.JSON(http.StatusOK, CreateCorrelationResponseBody{
		Result:  *correlation,
		Message: "Correlation created",
	})
}

// deleteHandler routes DELETE /api/datasources/uid/:uid/correlations/:correlationUID to the Resource API
func (ck8s *correlationK8sHandler) deleteHandler(c *contextmodel.ReqContext) response.Response {
	correlationUID := web.Params(c.Req)[":correlationUID"]
	if correlationUID == "" {
		return response.Error(http.StatusBadRequest, "Correlation UID is required", nil)
	}

	client, ok := ck8s.getClient(c)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Failed to get client", nil)
	}

	// Check if correlation exists and is not read-only
	existing, err := client.Get(c.Req.Context(), correlationUID, v1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			return response.Error(http.StatusNotFound, "Correlation not found", ErrCorrelationNotFound)
		}
		return ck8s.handleError(err)
	}

	// Check if provisioned (read-only)
	if ck8s.isProvisioned(existing) {
		return response.Error(http.StatusForbidden, "Correlation can only be edited via provisioning", ErrCorrelationReadOnly)
	}

	err = client.Delete(c.Req.Context(), correlationUID, v1.DeleteOptions{})
	if err != nil {
		return ck8s.handleError(err)
	}

	return response.JSON(http.StatusOK, DeleteCorrelationResponseBody{Message: "Correlation deleted"})
}

// updateHandler routes PATCH /api/datasources/uid/:uid/correlations/:correlationUID to the Resource API
func (ck8s *correlationK8sHandler) updateHandler(c *contextmodel.ReqContext) response.Response {
	cmd := UpdateCorrelationCommand{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		if err == ErrUpdateCorrelationEmptyParams {
			return response.Error(http.StatusBadRequest, "At least one of label, description or config is required", err)
		}
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	if err := cmd.Validate(); err != nil {
		return response.Error(http.StatusBadRequest, err.Error(), err)
	}

	cmd.UID = web.Params(c.Req)[":correlationUID"]
	cmd.SourceUID = web.Params(c.Req)[":uid"]
	cmd.OrgId = c.GetOrgID()

	client, ok := ck8s.getClient(c)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Failed to get client", nil)
	}

	// Get existing correlation first
	existing, err := client.Get(c.Req.Context(), cmd.UID, v1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			return response.Error(http.StatusNotFound, "Correlation not found", ErrCorrelationNotFound)
		}
		return ck8s.handleError(err)
	}

	// Check if provisioned (read-only)
	if ck8s.isProvisioned(existing) {
		return response.Error(http.StatusForbidden, "Correlation can only be edited via provisioning", ErrCorrelationReadOnly)
	}

	// Get existing spec and apply patches
	spec, _, err := unstructured.NestedMap(existing.Object, "spec")
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to get spec", err)
	}

	// Apply patches only for non-nil values
	if cmd.Label != nil {
		spec["label"] = *cmd.Label
	}
	if cmd.Description != nil {
		spec["description"] = *cmd.Description
	}
	if cmd.Type != nil {
		spec["type"] = string(*cmd.Type)
	}
	if cmd.Config != nil {
		config, _, _ := unstructured.NestedMap(existing.Object, "spec", "config")
		if config == nil {
			config = map[string]any{}
		}
		if cmd.Config.Field != nil {
			config["field"] = *cmd.Config.Field
		}
		if cmd.Config.Target != nil {
			config["target"] = *cmd.Config.Target
		}
		if cmd.Config.Transformations != nil {
			transformations := make([]any, len(cmd.Config.Transformations))
			for i, t := range cmd.Config.Transformations {
				transformations[i] = map[string]any{
					"type":       t.Type,
					"expression": t.Expression,
					"field":      t.Field,
					"mapValue":   t.MapValue,
				}
			}
			config["transformations"] = transformations
		}
		spec["config"] = config
	}

	if err := unstructured.SetNestedMap(existing.Object, spec, "spec"); err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to set spec", err)
	}

	updated, err := client.Update(c.Req.Context(), existing, v1.UpdateOptions{})
	if err != nil {
		return ck8s.handleError(err)
	}

	correlation := ck8s.unstructuredToLegacyCorrelation(*updated)
	if correlation == nil {
		return response.Error(http.StatusInternalServerError, "Failed to convert correlation", nil)
	}

	return response.JSON(http.StatusOK, UpdateCorrelationResponseBody{
		Message: "Correlation updated",
		Result:  *correlation,
	})
}

//-----------------------------------------------------------------------------------------
// Utility functions
//-----------------------------------------------------------------------------------------

func (ck8s *correlationK8sHandler) getClient(c *contextmodel.ReqContext) (dynamic.ResourceInterface, bool) {
	if ck8s.clientConfigProvider == nil {
		c.JsonApiErr(500, "Client config provider not available", nil)
		return nil, false
	}
	restConfig := ck8s.clientConfigProvider.GetDirectRestConfig(c)
	if restConfig == nil {
		c.JsonApiErr(500, "REST config not available", nil)
		return nil, false
	}
	dyn, err := dynamic.NewForConfig(restConfig)
	if err != nil {
		c.JsonApiErr(500, "Failed to create client", err)
		return nil, false
	}
	return dyn.Resource(ck8s.gvr).Namespace(ck8s.namespacer(c.OrgID)), true
}

func (ck8s *correlationK8sHandler) handleError(err error) response.Response {
	//nolint:errorlint
	statusError, ok := err.(*errors.StatusError)
	if ok {
		code := int(statusError.Status().Code)
		return response.Error(code, statusError.Status().Message, err)
	}
	return response.Error(http.StatusInternalServerError, "Internal error", err)
}

func (ck8s *correlationK8sHandler) isProvisioned(obj *unstructured.Unstructured) bool {
	annotations := obj.GetAnnotations()
	if annotations == nil {
		return false
	}
	provisioned, ok := annotations["grafana.app/provisioned"]
	return ok && provisioned == "true"
}

func (ck8s *correlationK8sHandler) legacyCreateToUnstructured(cmd CreateCorrelationCommand, sourceDS *datasources.DataSource, targetDS *datasources.DataSource) unstructured.Unstructured {
	spec := map[string]any{
		"type":  string(cmd.Type),
		"label": cmd.Label,
		"source": map[string]any{
			"group": sourceDS.Type,
			"name":  sourceDS.UID,
		},
		"config": map[string]any{
			"field":  cmd.Config.Field,
			"target": cmd.Config.Target,
		},
	}

	if cmd.Description != "" {
		spec["description"] = cmd.Description
	}

	if targetDS != nil {
		spec["target"] = map[string]any{
			"group": targetDS.Type,
			"name":  targetDS.UID,
		}
	}

	if len(cmd.Config.Transformations) > 0 {
		configSpec := spec["config"].(map[string]any)
		transformations := make([]any, len(cmd.Config.Transformations))
		for i, t := range cmd.Config.Transformations {
			transformations[i] = map[string]any{
				"type":       t.Type,
				"expression": t.Expression,
				"field":      t.Field,
				"mapValue":   t.MapValue,
			}
		}
		configSpec["transformations"] = transformations
	}

	obj := unstructured.Unstructured{
		Object: map[string]any{
			"apiVersion": fmt.Sprintf("%s/%s", correlationsV0.APIGroup, correlationsV0.APIVersion),
			"kind":       "Correlation",
			"metadata":   map[string]any{},
			"spec":       spec,
		},
	}

	if cmd.Provisioned {
		obj.SetAnnotations(map[string]string{
			"grafana.app/provisioned": "true",
		})
	}

	return obj
}

func (ck8s *correlationK8sHandler) unstructuredToLegacyCorrelation(item unstructured.Unstructured) *Correlation {
	spec, _, err := unstructured.NestedMap(item.Object, "spec")
	if err != nil {
		return nil
	}

	corr := &Correlation{
		UID: item.GetName(),
	}

	// Get type
	if t, ok := spec["type"].(string); ok {
		corr.Type = CorrelationType(t)
	}

	// Get label
	if label, ok := spec["label"].(string); ok {
		corr.Label = label
	}

	// Get description
	if desc, ok := spec["description"].(string); ok {
		corr.Description = desc
	}

	// Get source
	if source, ok := spec["source"].(map[string]any); ok {
		if name, ok := source["name"].(string); ok {
			corr.SourceUID = name
		}
		if group, ok := source["group"].(string); ok {
			sourceType := group
			corr.SourceType = &sourceType
		}
	}

	// Get target
	if target, ok := spec["target"].(map[string]any); ok {
		if name, ok := target["name"].(string); ok {
			corr.TargetUID = &name
		}
		if group, ok := target["group"].(string); ok {
			targetType := group
			corr.TargetType = &targetType
		}
	}

	// Get config
	if config, ok := spec["config"].(map[string]any); ok {
		corr.Config = CorrelationConfig{}
		if field, ok := config["field"].(string); ok {
			corr.Config.Field = field
		}
		if target, ok := config["target"].(map[string]any); ok {
			corr.Config.Target = target
		}
		if transformations, ok := config["transformations"].([]any); ok {
			corr.Config.Transformations = make(Transformations, 0, len(transformations))
			for _, t := range transformations {
				if tMap, ok := t.(map[string]any); ok {
					trans := Transformation{}
					if typ, ok := tMap["type"].(string); ok {
						trans.Type = typ
					}
					if expr, ok := tMap["expression"].(string); ok {
						trans.Expression = expr
					}
					if field, ok := tMap["field"].(string); ok {
						trans.Field = field
					}
					if mapVal, ok := tMap["mapValue"].(string); ok {
						trans.MapValue = mapVal
					}
					corr.Config.Transformations = append(corr.Config.Transformations, trans)
				}
			}
		}
	}

	// Check if provisioned
	annotations := item.GetAnnotations()
	if annotations != nil {
		if provisioned, ok := annotations["grafana.app/provisioned"]; ok && provisioned == "true" {
			corr.Provisioned = true
		}
	}

	return corr
}

func joinFieldSelectors(selectors []string) string {
	result := ""
	for i, s := range selectors {
		if i > 0 {
			result += ","
		}
		result += s
	}
	return result
}

// MarshalJSON for json encoding - needed for proper serialization
func (c CorrelationType) MarshalJSON() ([]byte, error) {
	return json.Marshal(string(c))
}
