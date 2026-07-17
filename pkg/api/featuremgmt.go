package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/featuretoggleadmin"
)

func (hs *HTTPServer) AdminGetFeatureTogglesResolved(c *contextmodel.ReqContext) response.Response {
	if hs.FeatureToggleAdmin == nil {
		return response.Error(http.StatusInternalServerError, "Feature toggle admin service not configured", nil)
	}

	allowEditing := ac.HasAccess(hs.AccessControl, c)(ac.EvalPermission(ac.ActionFeatureManagementWrite))
	state := hs.FeatureToggleAdmin.GetResolvedStateResponse(allowEditing)
	return response.JSON(http.StatusOK, state)
}

func (hs *HTTPServer) AdminUpdateFeatureToggle(c *contextmodel.ReqContext) response.Response {
	if hs.FeatureToggleAdmin == nil {
		return response.Error(http.StatusInternalServerError, "Feature toggle admin service not configured", nil)
	}

	var req featuretoggleadmin.UpdateFlagRequest
	if err := json.NewDecoder(c.Req.Body).Decode(&req); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	if req.Name == "" {
		return response.Error(http.StatusBadRequest, "flag name is required", nil)
	}

	err := hs.FeatureToggleAdmin.UpdateFlag(
		c.Req.Context(),
		req,
		c.SignedInUser.UserID,
		c.SignedInUser.Login,
		c.SignedInUser.OrgID,
	)
	if err != nil {
		if errors.Is(err, featuremgmt.ErrUnknownFeatureFlag) {
			return response.Error(http.StatusNotFound, "unknown feature flag", err)
		}
		if errors.Is(err, featuremgmt.ErrFeatureFlagLocked) {
			return response.Error(http.StatusForbidden, "feature flag is locked by configuration", err)
		}
		if errors.Is(err, featuremgmt.ErrFeatureFlagRestricted) {
			return response.Error(http.StatusForbidden, "feature flag cannot be changed in this environment", err)
		}
		return response.Error(http.StatusInternalServerError, "failed to update feature flag", err)
	}

	return response.Success("Feature flag updated")
}

func (hs *HTTPServer) AdminResetFeatureToggle(c *contextmodel.ReqContext) response.Response {
	if hs.FeatureToggleAdmin == nil {
		return response.Error(http.StatusInternalServerError, "Feature toggle admin service not configured", nil)
	}

	name := c.Query("name")
	if name == "" {
		return response.Error(http.StatusBadRequest, "flag name is required", nil)
	}

	err := hs.FeatureToggleAdmin.ResetFlag(
		c.Req.Context(),
		name,
		c.SignedInUser.UserID,
		c.SignedInUser.Login,
		c.SignedInUser.OrgID,
	)
	if err != nil {
		if errors.Is(err, featuremgmt.ErrUnknownFeatureFlag) {
			return response.Error(http.StatusNotFound, "unknown feature flag", err)
		}
		if errors.Is(err, featuremgmt.ErrFeatureFlagLocked) {
			return response.Error(http.StatusForbidden, "feature flag is locked by configuration", err)
		}
		return response.Error(http.StatusInternalServerError, "failed to reset feature flag", err)
	}

	return response.Success("Feature flag reset")
}
