package api

import (
	"net/http"
	"sort"
	"strings"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/middleware"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/web"
)

// registerLabsFeatureTogglesAPI registers org-admin (or server admin) feature toggle APIs for the Labs UI.
func (hs *HTTPServer) registerLabsFeatureTogglesAPI() {
	hs.RouteRegister.Group("/api/labs/feature-toggles", func(toggleRoute routing.RouteRegister) {
		toggleRoute.Get("/", middleware.ReqSignedIn, middleware.ReqGrafanaOrOrgAdmin, routing.Wrap(hs.getLabsFeatureToggles))
		toggleRoute.Put("/:flagId", middleware.ReqSignedIn, middleware.ReqGrafanaOrOrgAdmin, routing.Wrap(hs.setLabsFeatureToggle))
		toggleRoute.Delete("/:flagId", middleware.ReqSignedIn, middleware.ReqGrafanaOrOrgAdmin, routing.Wrap(hs.clearLabsFeatureToggleOverride))
	})
}

// LabsFeatureFlagDTO is returned to the Labs UI.
type LabsFeatureFlagDTO struct {
	Name                 string `json:"name"`
	Enabled              bool   `json:"enabled"`
	Stage                string `json:"stage"`
	Description          string `json:"description"`
	Expression           string `json:"expression"`
	RequiresDevMode      bool   `json:"requiresDevMode"`
	RequiresRestart      bool   `json:"requiresRestart"`
	FrontendOnly         bool   `json:"frontendOnly"`
	HasRuntimeOverride   bool   `json:"hasRuntimeOverride"`
	RuntimeOverrideValue *bool  `json:"runtimeOverrideValue,omitempty"`
}

// PutLabsFeatureToggleRequest is the request body for PUT.
type PutLabsFeatureToggleRequest struct {
	Enabled bool `json:"enabled"`
}

func (hs *HTTPServer) getLabsFeatureToggles(c *contextmodel.ReqContext) response.Response {
	if hs.featureManager == nil {
		return response.JSON(http.StatusNotImplemented, map[string]string{"message": "Feature management not available"})
	}
	m := hs.featureManager
	flags := m.GetFlags()
	sort.Slice(flags, func(i, j int) bool { return flags[i].Name < flags[j].Name })
	enabled := m.GetEnabled(c.Req.Context())
	over := m.GetRuntimeToggleOverrides()
	out := make([]LabsFeatureFlagDTO, 0, len(flags))
	for _, f := range flags {
		ov, hasOv := over[f.Name]
		dto := LabsFeatureFlagDTO{
			Name:               f.Name,
			Enabled:            enabled[f.Name],
			Stage:              f.Stage.String(),
			Description:        f.Description,
			Expression:         f.Expression,
			RequiresDevMode:    f.RequiresDevMode,
			RequiresRestart:    f.RequiresRestart,
			FrontendOnly:       f.FrontendOnly,
			HasRuntimeOverride: hasOv,
		}
		if hasOv {
			v := ov
			dto.RuntimeOverrideValue = &v
		}
		out = append(out, dto)
	}
	return response.JSON(http.StatusOK, out)
}

func (hs *HTTPServer) setLabsFeatureToggle(c *contextmodel.ReqContext) response.Response {
	if hs.featureManager == nil {
		return response.JSON(http.StatusNotImplemented, map[string]string{"message": "Feature management not available"})
	}
	flagID := web.Params(c.Req)[":flagId"]
	if flagID == "" {
		return response.JSON(http.StatusBadRequest, map[string]string{"message": "Missing flag"})
	}
	var body PutLabsFeatureToggleRequest
	if err := web.Bind(c.Req, &body); err != nil {
		return response.Error(http.StatusBadRequest, "Invalid JSON", err)
	}
	if err := hs.featureManager.SetRuntimeOverride(flagID, body.Enabled); err != nil {
		hs.log.Error("labs: set feature toggle", "err", err, "flag", flagID)
		if strings.Contains(err.Error(), "unknown") {
			return response.Error(http.StatusBadRequest, err.Error(), err)
		}
		return response.Error(http.StatusInternalServerError, "Failed to update feature toggle", err)
	}
	if err := hs.persistLabsRuntimeTogglesToKV(c.Req.Context()); err != nil {
		hs.log.Error("Failed to persist Labs feature toggle overrides to KV", "err", err)
	}
	return response.JSON(http.StatusOK, map[string]any{
		"name":    flagID,
		"enabled": hs.featureManager.IsEnabled(c.Req.Context(), flagID),
	})
}

func (hs *HTTPServer) clearLabsFeatureToggleOverride(c *contextmodel.ReqContext) response.Response {
	if hs.featureManager == nil {
		return response.JSON(http.StatusNotImplemented, map[string]string{"message": "Feature management not available"})
	}
	flagID := web.Params(c.Req)[":flagId"]
	hs.featureManager.ClearRuntimeOverride(flagID)
	if err := hs.persistLabsRuntimeTogglesToKV(c.Req.Context()); err != nil {
		hs.log.Error("Failed to persist Labs feature toggle overrides to KV", "err", err)
	}
	return response.JSON(http.StatusOK, map[string]any{
		"name":    flagID,
		"enabled": hs.featureManager.IsEnabled(c.Req.Context(), flagID),
	})
}
