package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/web"
)

type setFeatureToggleRequest struct {
	Enabled bool `json:"enabled"`
}

func (hs *HTTPServer) AdminGetFeatureToggles(c *contextmodel.ReqContext) response.Response {
	if hs.FeatureToggleAdmin == nil {
		return response.Error(http.StatusInternalServerError, "Feature toggle admin is unavailable", nil)
	}

	canWrite, err := hs.AccessControl.Evaluate(c.Req.Context(), c.SignedInUser, ac.EvalPermission(ac.ActionFeatureManagementWrite))
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to evaluate permissions", err)
	}

	return response.JSON(http.StatusOK, hs.FeatureToggleAdmin.GetResolvedState(c.Req.Context(), canWrite))
}

func (hs *HTTPServer) AdminSetFeatureToggle(c *contextmodel.ReqContext) response.Response {
	if hs.FeatureToggleAdmin == nil {
		return response.Error(http.StatusInternalServerError, "Feature toggle admin is unavailable", nil)
	}

	name := web.Params(c.Req)[":name"]
	var req setFeatureToggleRequest
	if err := json.NewDecoder(c.Req.Body).Decode(&req); err != nil {
		return response.Error(http.StatusBadRequest, "Invalid request body", err)
	}

	actor := c.GetLogin()
	if actor == "" {
		actor = "unknown"
	}

	if err := hs.FeatureToggleAdmin.SetOverride(c.Req.Context(), name, req.Enabled, actor); err != nil {
		switch {
		case errors.Is(err, featuremgmt.ErrUnknownFeatureFlag):
			return response.Error(http.StatusNotFound, "Feature flag not found", err)
		case errors.Is(err, featuremgmt.ErrFeatureFlagReadOnly):
			return response.Error(http.StatusConflict, "Feature flag is configured in grafana.ini and cannot be changed", err)
		case errors.Is(err, featuremgmt.ErrFeatureFlagNotWriteable):
			return response.Error(http.StatusConflict, "Feature flag is not writeable", err)
		default:
			return response.Error(http.StatusInternalServerError, "Failed to update feature flag", err)
		}
	}

	return response.JSON(http.StatusOK, hs.FeatureToggleAdmin.GetResolvedState(c.Req.Context(), true))
}

func (hs *HTTPServer) AdminDeleteFeatureToggle(c *contextmodel.ReqContext) response.Response {
	if hs.FeatureToggleAdmin == nil {
		return response.Error(http.StatusInternalServerError, "Feature toggle admin is unavailable", nil)
	}

	name := web.Params(c.Req)[":name"]
	actor := c.GetLogin()
	if actor == "" {
		actor = "unknown"
	}

	if err := hs.FeatureToggleAdmin.DeleteOverride(c.Req.Context(), name, actor); err != nil {
		switch {
		case errors.Is(err, featuremgmt.ErrUnknownFeatureFlag):
			return response.Error(http.StatusNotFound, "Feature flag not found", err)
		case errors.Is(err, featuremgmt.ErrFeatureFlagReadOnly):
			return response.Error(http.StatusConflict, "Feature flag is configured in grafana.ini and cannot be changed", err)
		default:
			return response.Error(http.StatusInternalServerError, "Failed to delete feature flag override", err)
		}
	}

	return response.JSON(http.StatusOK, hs.FeatureToggleAdmin.GetResolvedState(c.Req.Context(), true))
}
