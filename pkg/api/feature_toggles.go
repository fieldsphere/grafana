package api

import (
	"errors"
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/web"
)

type featureToggleDTO struct {
	Name          string `json:"name"`
	Description   string `json:"description"`
	Stage         string `json:"stage"`
	RequiresDev   bool   `json:"requiresDevMode"`
	RequiresStart bool   `json:"requiresRestart"`
	Enabled       bool   `json:"enabled"`
}

type updateFeatureToggleCommand struct {
	Enabled bool `json:"enabled"`
}

type updateFeatureToggleResponse struct {
	Name    string `json:"name"`
	Enabled bool   `json:"enabled"`
}

// GetFeatureToggles returns all known feature flags with current runtime state.
func (hs *HTTPServer) GetFeatureToggles(c *contextmodel.ReqContext) response.Response {
	manager, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusNotImplemented, "Feature toggle management is unavailable", nil)
	}

	flags, enabled := manager.GetSnapshot()

	items := make([]featureToggleDTO, 0, len(flags))
	for _, flag := range flags {
		items = append(items, featureToggleDTO{
			Name:          flag.Name,
			Description:   flag.Description,
			Stage:         flag.Stage.String(),
			RequiresDev:   flag.RequiresDevMode,
			RequiresStart: flag.RequiresRestart,
			Enabled:       enabled[flag.Name],
		})
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].Name < items[j].Name
	})

	return response.JSON(http.StatusOK, items)
}

// UpdateFeatureToggle updates in-memory runtime state for a feature flag.
func (hs *HTTPServer) UpdateFeatureToggle(c *contextmodel.ReqContext) response.Response {
	manager, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusNotImplemented, "Feature toggle management is unavailable", nil)
	}

	var cmd updateFeatureToggleCommand
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	name := web.Params(c.Req)[":name"]
	if name == "" {
		return response.Error(http.StatusBadRequest, "Feature toggle name is required", nil)
	}

	if err := manager.SetStartupState(name, cmd.Enabled); err != nil {
		if errors.Is(err, featuremgmt.ErrFeatureFlagNotFound) {
			return response.Error(http.StatusNotFound, "Feature toggle not found", err)
		}
		return response.Error(http.StatusInternalServerError, "Failed to update feature toggle", err)
	}

	return response.JSON(http.StatusOK, updateFeatureToggleResponse{
		Name:    name,
		Enabled: manager.IsEnabledGlobally(name),
	})
}
