package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
)

// FeatureFlagDTO represents a feature flag with its definition and current state
type FeatureFlagDTO struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Enabled         bool   `json:"enabled"`
	RequiresDevMode bool   `json:"requiresDevMode,omitempty"`
	FrontendOnly    bool   `json:"frontendOnly,omitempty"`
	RequiresRestart bool   `json:"requiresRestart,omitempty"`
}

// GetFeatureFlags returns all feature flags with their current state
// swagger:route GET /api/featureflags labs getFeatureFlags
//
// Get all feature flags.
//
// Returns all feature flags with their definitions and current enabled state.
//
// Responses:
// 200: getFeatureFlagsResponse
// 401: unauthorizedError
func (hs *HTTPServer) GetFeatureFlags(c *contextmodel.ReqContext) response.Response {
	flags := hs.featureManager.GetFlags()
	enabledFlags := hs.Features.GetEnabled(c.Req.Context())

	result := make([]FeatureFlagDTO, 0, len(flags))
	for _, flag := range flags {
		// Skip flags that are hidden from docs (internal flags)
		if flag.HideFromDocs {
			continue
		}

		dto := FeatureFlagDTO{
			Name:            flag.Name,
			Description:     flag.Description,
			Stage:           flag.Stage.String(),
			Enabled:         enabledFlags[flag.Name],
			RequiresDevMode: flag.RequiresDevMode,
			FrontendOnly:    flag.FrontendOnly,
			RequiresRestart: flag.RequiresRestart,
		}
		result = append(result, dto)
	}

	// Sort by name for consistent ordering
	sort.Slice(result, func(i, j int) bool {
		return result[i].Name < result[j].Name
	})

	return response.JSON(http.StatusOK, result)
}

// swagger:response getFeatureFlagsResponse
type GetFeatureFlagsResponse struct {
	// in: body
	Body []FeatureFlagDTO `json:"body"`
}
