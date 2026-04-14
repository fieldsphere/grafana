package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/web"
)

const (
	labsFeatureToggleKVNamespace = "labs.feature_toggles"
	labsFeatureToggleKVKey       = "overrides"
)

func (hs *HTTPServer) labsFeatureToggleKVGet(ctx context.Context) (featuremgmt.LabsOverrides, error) {
	raw, ok, err := hs.kvStore.Get(ctx, 0, labsFeatureToggleKVNamespace, labsFeatureToggleKVKey)
	if err != nil {
		return featuremgmt.LabsOverrides{}, err
	}
	if !ok || raw == "" {
		return featuremgmt.LabsOverrides{}, nil
	}
	var out featuremgmt.LabsOverrides
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return nil, fmt.Errorf("parse labs overrides: %w", err)
	}
	if out == nil {
		out = featuremgmt.LabsOverrides{}
	}
	return out, nil
}

func (hs *HTTPServer) labsFeatureToggleKVSet(ctx context.Context, overrides featuremgmt.LabsOverrides) error {
	if overrides == nil {
		overrides = featuremgmt.LabsOverrides{}
	}
	b, err := json.Marshal(overrides)
	if err != nil {
		return err
	}
	return hs.kvStore.Set(ctx, 0, labsFeatureToggleKVNamespace, labsFeatureToggleKVKey, string(b))
}

func (hs *HTTPServer) loadLabsFeatureOverridesIntoManager() {
	fm, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return
	}
	overrides, err := hs.labsFeatureToggleKVGet(context.Background())
	if err != nil {
		hs.log.Warn("Failed to load Labs feature toggle overrides", "err", err)
		return
	}
	fm.SetLabsOverrides(overrides)
}

// GET /api/admin/labs/feature-toggles
func (hs *HTTPServer) AdminLabsFeatureTogglesList(c *contextmodel.ReqContext) response.Response {
	if c.SignedInUser == nil || !c.SignedInUser.GetIsGrafanaAdmin() {
		return response.Error(http.StatusForbidden, "Permission denied", nil)
	}
	ok, err := hs.AccessControl.Evaluate(c.Req.Context(), c.SignedInUser, ac.EvalPermission(ac.ActionFeatureManagementRead))
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to evaluate permissions", err)
	}
	if !ok {
		return response.Error(http.StatusForbidden, "Permission denied", nil)
	}

	fm, fmOk := hs.Features.(*featuremgmt.FeatureManager)
	if !fmOk {
		return response.Error(http.StatusInternalServerError, "Feature manager unavailable", nil)
	}

	return response.JSON(http.StatusOK, fm.ListLabsFlags(c.Req.Context()))
}

type labsSetFlagBody struct {
	Enabled bool `json:"enabled"`
}

// PUT /api/admin/labs/feature-toggles/:name
func (hs *HTTPServer) AdminLabsFeatureToggleSet(c *contextmodel.ReqContext) response.Response {
	if c.SignedInUser == nil || !c.SignedInUser.GetIsGrafanaAdmin() {
		return response.Error(http.StatusForbidden, "Permission denied", nil)
	}
	ok, err := hs.AccessControl.Evaluate(c.Req.Context(), c.SignedInUser, ac.EvalPermission(ac.ActionFeatureManagementWrite))
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to evaluate permissions", err)
	}
	if !ok {
		return response.Error(http.StatusForbidden, "Permission denied", nil)
	}

	name := web.Params(c.Req)[":name"]
	if name == "" {
		return response.Error(http.StatusBadRequest, "missing flag name", nil)
	}

	bodyBytes, err := io.ReadAll(c.Req.Body)
	if err != nil {
		return response.Error(http.StatusBadRequest, "invalid request body", err)
	}
	var body labsSetFlagBody
	if err := json.Unmarshal(bodyBytes, &body); err != nil {
		return response.Error(http.StatusBadRequest, "invalid JSON body", err)
	}

	fm, fmOk := hs.Features.(*featuremgmt.FeatureManager)
	if !fmOk {
		return response.Error(http.StatusInternalServerError, "Feature manager unavailable", nil)
	}

	flag := fm.GetFlagDefinition(name)
	if flag == nil {
		return response.Error(http.StatusNotFound, "unknown feature flag", nil)
	}
	if !fm.LabsWritable(flag) {
		return response.Error(http.StatusBadRequest, "this flag cannot be changed from Labs (restart-required, dev-only, or runtime blocked)", nil)
	}

	overrides, err := hs.labsFeatureToggleKVGet(c.Req.Context())
	if err != nil {
		return response.Error(http.StatusInternalServerError, "failed to read overrides", err)
	}
	if overrides == nil {
		overrides = featuremgmt.LabsOverrides{}
	}
	overrides[name] = body.Enabled
	if err := hs.labsFeatureToggleKVSet(c.Req.Context(), overrides); err != nil {
		return response.Error(http.StatusInternalServerError, "failed to save overrides", err)
	}
	fm.SetLabsOverrides(overrides)

	return response.JSON(http.StatusOK, map[string]any{"name": name, "enabled": body.Enabled})
}

// DELETE /api/admin/labs/feature-toggles/:name
func (hs *HTTPServer) AdminLabsFeatureToggleDelete(c *contextmodel.ReqContext) response.Response {
	if c.SignedInUser == nil || !c.SignedInUser.GetIsGrafanaAdmin() {
		return response.Error(http.StatusForbidden, "Permission denied", nil)
	}
	ok, err := hs.AccessControl.Evaluate(c.Req.Context(), c.SignedInUser, ac.EvalPermission(ac.ActionFeatureManagementWrite))
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to evaluate permissions", err)
	}
	if !ok {
		return response.Error(http.StatusForbidden, "Permission denied", nil)
	}

	name := web.Params(c.Req)[":name"]
	if name == "" {
		return response.Error(http.StatusBadRequest, "missing flag name", nil)
	}

	fm, fmOk := hs.Features.(*featuremgmt.FeatureManager)
	if !fmOk {
		return response.Error(http.StatusInternalServerError, "Feature manager unavailable", nil)
	}

	overrides, err := hs.labsFeatureToggleKVGet(c.Req.Context())
	if err != nil {
		return response.Error(http.StatusInternalServerError, "failed to read overrides", err)
	}
	if overrides == nil {
		overrides = featuremgmt.LabsOverrides{}
	}
	delete(overrides, name)
	if err := hs.labsFeatureToggleKVSet(c.Req.Context(), overrides); err != nil {
		return response.Error(http.StatusInternalServerError, "failed to save overrides", err)
	}
	fm.SetLabsOverrides(overrides)

	return response.JSON(http.StatusOK, map[string]any{"name": name, "cleared": true})
}
