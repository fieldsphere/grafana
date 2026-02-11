package api

import (
	"fmt"
	"net/http"
	"strconv"

	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"

	annotationV0 "github.com/grafana/grafana/apps/annotation/pkg/apis/annotation/v0alpha1"
	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/services/annotations"
	grafanaapiserver "github.com/grafana/grafana/pkg/services/apiserver"
	"github.com/grafana/grafana/pkg/services/apiserver/endpoints/request"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/web"
)

type annotationK8sHandler struct {
	namespacer           request.NamespaceMapper
	gvr                  schema.GroupVersionResource
	clientConfigProvider grafanaapiserver.DirectRestConfigProvider
}

func newAnnotationK8sHandler(hs *HTTPServer) *annotationK8sHandler {
	return &annotationK8sHandler{
		gvr: schema.GroupVersionResource{
			Group:    annotationV0.APIGroup,
			Version:  annotationV0.APIVersion,
			Resource: "annotations",
		},
		namespacer:           request.GetNamespaceMapper(hs.Cfg),
		clientConfigProvider: hs.clientConfigProvider,
	}
}

// getAnnotationsHandler routes GET /api/annotations to the Resource API
func (ak8s *annotationK8sHandler) getAnnotationsHandler(c *contextmodel.ReqContext) response.Response {
	client, ok := ak8s.getClient(c)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Failed to get client", nil)
	}

	// Build list options from query parameters
	listOpts := v1.ListOptions{}
	fieldSelectors := []string{}

	if dashboardUID := c.Query("dashboardUID"); dashboardUID != "" {
		fieldSelectors = append(fieldSelectors, fmt.Sprintf("spec.dashboardUID=%s", dashboardUID))
	}
	if panelID := c.QueryInt64("panelId"); panelID != 0 {
		fieldSelectors = append(fieldSelectors, fmt.Sprintf("spec.panelID=%d", panelID))
	}
	if from := c.QueryInt64("from"); from != 0 {
		fieldSelectors = append(fieldSelectors, fmt.Sprintf("spec.time=%d", from))
	}
	if to := c.QueryInt64("to"); to != 0 {
		fieldSelectors = append(fieldSelectors, fmt.Sprintf("spec.timeEnd=%d", to))
	}

	if len(fieldSelectors) > 0 {
		listOpts.FieldSelector = joinFieldSelectors(fieldSelectors)
	}

	if limit := c.QueryInt64("limit"); limit > 0 {
		listOpts.Limit = limit
	} else {
		listOpts.Limit = defaultAnnotationsLimit
	}

	list, err := client.List(c.Req.Context(), listOpts)
	if err != nil {
		return ak8s.handleError(err)
	}

	// Convert to legacy format
	items := make([]*annotations.ItemDTO, 0, len(list.Items))
	for _, item := range list.Items {
		items = append(items, ak8s.unstructuredToLegacyAnnotation(item))
	}

	return response.JSON(http.StatusOK, items)
}

// postAnnotationHandler routes POST /api/annotations to the Resource API
func (ak8s *annotationK8sHandler) postAnnotationHandler(c *contextmodel.ReqContext) response.Response {
	cmd := dtos.PostAnnotationsCmd{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	if cmd.Text == "" {
		return response.Error(http.StatusBadRequest, "text field should not be empty", nil)
	}

	client, ok := ak8s.getClient(c)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Failed to get client", nil)
	}

	obj := ak8s.legacyCreateToUnstructured(cmd)
	obj.SetGenerateName("a-") // prefix for generated name

	out, err := client.Create(c.Req.Context(), &obj, v1.CreateOptions{})
	if err != nil {
		return ak8s.handleError(err)
	}

	// Parse the ID from the name (format: a-<id>)
	id, _ := parseAnnotationIDFromName(out.GetName())

	return response.JSON(http.StatusOK, map[string]any{
		"message": "Annotation added",
		"id":      id,
	})
}

// getAnnotationByIDHandler routes GET /api/annotations/:annotationId to the Resource API
func (ak8s *annotationK8sHandler) getAnnotationByIDHandler(c *contextmodel.ReqContext) response.Response {
	annotationID, err := strconv.ParseInt(web.Params(c.Req)[":annotationId"], 10, 64)
	if err != nil {
		return response.Error(http.StatusBadRequest, "annotationId is invalid", err)
	}

	client, ok := ak8s.getClient(c)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Failed to get client", nil)
	}

	name := fmt.Sprintf("a-%d", annotationID)
	out, err := client.Get(c.Req.Context(), name, v1.GetOptions{})
	if err != nil {
		return ak8s.handleError(err)
	}

	return response.JSON(http.StatusOK, ak8s.unstructuredToLegacyAnnotation(*out))
}

// updateAnnotationHandler routes PUT /api/annotations/:annotationId to the Resource API
func (ak8s *annotationK8sHandler) updateAnnotationHandler(c *contextmodel.ReqContext) response.Response {
	cmd := dtos.UpdateAnnotationsCmd{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	annotationID, err := strconv.ParseInt(web.Params(c.Req)[":annotationId"], 10, 64)
	if err != nil {
		return response.Error(http.StatusBadRequest, "annotationId is invalid", err)
	}

	client, ok := ak8s.getClient(c)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Failed to get client", nil)
	}

	name := fmt.Sprintf("a-%d", annotationID)

	// Get existing annotation first
	existing, err := client.Get(c.Req.Context(), name, v1.GetOptions{})
	if err != nil {
		return ak8s.handleError(err)
	}

	// Get existing spec and apply updates, preserving fields not part of the update payload.
	spec, _, err := unstructured.NestedMap(existing.Object, "spec")
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to get spec", err)
	}
	if spec == nil {
		spec = map[string]any{}
	}

	spec["text"] = cmd.Text
	spec["time"] = cmd.Time
	if cmd.TimeEnd > 0 {
		spec["timeEnd"] = cmd.TimeEnd
	}
	// Write tags when present in request, including empty slice to clear existing tags.
	if cmd.Tags != nil {
		spec["tags"] = cmd.Tags
	}

	if err := unstructured.SetNestedMap(existing.Object, spec, "spec"); err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to set spec", err)
	}

	_, err = client.Update(c.Req.Context(), existing, v1.UpdateOptions{})
	if err != nil {
		return ak8s.handleError(err)
	}

	return response.Success("Annotation updated")
}

// patchAnnotationHandler routes PATCH /api/annotations/:annotationId to the Resource API
func (ak8s *annotationK8sHandler) patchAnnotationHandler(c *contextmodel.ReqContext) response.Response {
	cmd := dtos.PatchAnnotationsCmd{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	annotationID, err := strconv.ParseInt(web.Params(c.Req)[":annotationId"], 10, 64)
	if err != nil {
		return response.Error(http.StatusBadRequest, "annotationId is invalid", err)
	}

	client, ok := ak8s.getClient(c)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Failed to get client", nil)
	}

	name := fmt.Sprintf("a-%d", annotationID)

	// Get existing annotation first
	existing, err := client.Get(c.Req.Context(), name, v1.GetOptions{})
	if err != nil {
		return ak8s.handleError(err)
	}

	// Get existing spec and apply patches
	spec, _, err := unstructured.NestedMap(existing.Object, "spec")
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to get spec", err)
	}

	// Apply patches only for non-zero/non-empty values
	if cmd.Text != "" {
		spec["text"] = cmd.Text
	}
	if cmd.Time > 0 {
		spec["time"] = cmd.Time
	}
	if cmd.TimeEnd > 0 {
		spec["timeEnd"] = cmd.TimeEnd
	}
	if cmd.Tags != nil {
		spec["tags"] = cmd.Tags
	}

	if err := unstructured.SetNestedMap(existing.Object, spec, "spec"); err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to set spec", err)
	}

	_, err = client.Update(c.Req.Context(), existing, v1.UpdateOptions{})
	if err != nil {
		return ak8s.handleError(err)
	}

	return response.Success("Annotation patched")
}

// deleteAnnotationByIDHandler routes DELETE /api/annotations/:annotationId to the Resource API
func (ak8s *annotationK8sHandler) deleteAnnotationByIDHandler(c *contextmodel.ReqContext) response.Response {
	annotationID, err := strconv.ParseInt(web.Params(c.Req)[":annotationId"], 10, 64)
	if err != nil {
		return response.Error(http.StatusBadRequest, "annotationId is invalid", err)
	}

	client, ok := ak8s.getClient(c)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Failed to get client", nil)
	}

	name := fmt.Sprintf("a-%d", annotationID)
	err = client.Delete(c.Req.Context(), name, v1.DeleteOptions{})
	if err != nil {
		return ak8s.handleError(err)
	}

	return response.Success("Annotation deleted")
}

// getAnnotationTagsHandler routes GET /api/annotations/tags to the Resource API
func (ak8s *annotationK8sHandler) getAnnotationTagsHandler(c *contextmodel.ReqContext) response.Response {
	// The tags endpoint is a custom route in the annotation app
	// For now, we delegate to the legacy implementation since tags
	// are handled separately in the Resource API
	// This will be fully migrated when the tags endpoint is integrated
	return response.Error(http.StatusNotImplemented, "Tags endpoint not yet migrated to Resource API", nil)
}

//-----------------------------------------------------------------------------------------
// Utility functions
//-----------------------------------------------------------------------------------------

func (ak8s *annotationK8sHandler) getClient(c *contextmodel.ReqContext) (dynamic.ResourceInterface, bool) {
	dyn, err := dynamic.NewForConfig(ak8s.clientConfigProvider.GetDirectRestConfig(c))
	if err != nil {
		c.JsonApiErr(500, "Failed to create client", err)
		return nil, false
	}
	return dyn.Resource(ak8s.gvr).Namespace(ak8s.namespacer(c.OrgID)), true
}

func (ak8s *annotationK8sHandler) handleError(err error) response.Response {
	//nolint:errorlint
	statusError, ok := err.(*errors.StatusError)
	if ok {
		code := int(statusError.Status().Code)
		return response.Error(code, statusError.Status().Message, err)
	}
	return response.Error(http.StatusInternalServerError, "Internal error", err)
}

func (ak8s *annotationK8sHandler) legacyCreateToUnstructured(cmd dtos.PostAnnotationsCmd) unstructured.Unstructured {
	spec := map[string]any{
		"text": cmd.Text,
		"time": cmd.Time,
	}

	if cmd.TimeEnd > 0 {
		spec["timeEnd"] = cmd.TimeEnd
	}
	if cmd.DashboardUID != "" {
		spec["dashboardUID"] = cmd.DashboardUID
	}
	if cmd.PanelId > 0 {
		spec["panelID"] = cmd.PanelId
	}
	if len(cmd.Tags) > 0 {
		spec["tags"] = cmd.Tags
	}

	return unstructured.Unstructured{
		Object: map[string]any{
			"apiVersion": fmt.Sprintf("%s/%s", annotationV0.APIGroup, annotationV0.APIVersion),
			"kind":       "Annotation",
			"metadata":   map[string]any{},
			"spec":       spec,
		},
	}
}

func (ak8s *annotationK8sHandler) unstructuredToLegacyAnnotation(item unstructured.Unstructured) *annotations.ItemDTO {
	spec, _, _ := unstructured.NestedMap(item.Object, "spec")

	dto := &annotations.ItemDTO{}

	// Parse ID from name (format: a-<id>)
	if id, err := parseAnnotationIDFromName(item.GetName()); err == nil {
		dto.ID = id
	}

	if text, ok := spec["text"].(string); ok {
		dto.Text = text
	}
	if time, ok := spec["time"].(int64); ok {
		dto.Time = time
	}
	if timeEnd, ok := spec["timeEnd"].(int64); ok {
		dto.TimeEnd = timeEnd
	}
	if dashboardUID, ok := spec["dashboardUID"].(string); ok {
		dto.DashboardUID = &dashboardUID
	}
	if panelID, ok := spec["panelID"].(int64); ok {
		dto.PanelID = panelID
	}
	if tags, ok := spec["tags"].([]any); ok {
		dto.Tags = make([]string, len(tags))
		for i, t := range tags {
			if str, ok := t.(string); ok {
				dto.Tags[i] = str
			}
		}
	}

	// Convert creation timestamp to created field
	dto.Created = item.GetCreationTimestamp().UnixMilli()

	return dto
}

func parseAnnotationIDFromName(name string) (int64, error) {
	if len(name) < 3 || name[:2] != "a-" {
		return 0, fmt.Errorf("invalid annotation name format: %s", name)
	}
	return strconv.ParseInt(name[2:], 10, 64)
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
