package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
)

// OpenFeatureToggleDTO describes a non-GA feature flag and its current state.
type OpenFeatureToggleDTO struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Enabled         bool   `json:"enabled"`
	RequiresDevMode bool   `json:"requiresDevMode,omitempty"`
}

func isOpenFeatureStage(stage string) bool {
	switch stage {
	case "GA", "deprecated":
		return false
	default:
		return true
	}
}

// GetOpenFeatureToggles returns feature flags that are not generally available.
// swagger:response openFeatureTogglesResponse
// in:body
// type OpenFeatureToggleDTO
//
// swagger:route GET /feature-toggles/open feature_toggles getOpenFeatureToggles
//
// Get open (non-GA) feature toggles.
//
// Responses:
//   200: openFeatureTogglesResponse
func (hs *HTTPServer) GetOpenFeatureToggles(c *contextmodel.ReqContext) response.Response {
	featureList, err := featuremgmt.GetEmbeddedFeatureList()
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to load feature toggles", err)
	}

	enabled := hs.Features.GetEnabled(c.Req.Context())
	openToggles := make([]OpenFeatureToggleDTO, 0)

	for _, feature := range featureList.Items {
		if feature.Spec.HideFromDocs || !isOpenFeatureStage(feature.Spec.Stage) {
			continue
		}

		openToggles = append(openToggles, OpenFeatureToggleDTO{
			Name:            feature.Name,
			Description:     feature.Spec.Description,
			Stage:           feature.Spec.Stage,
			Enabled:         enabled[feature.Name],
			RequiresDevMode: feature.Spec.RequiresDevMode,
		})
	}

	sort.Slice(openToggles, func(i, j int) bool {
		return openToggles[i].Name < openToggles[j].Name
	})

	return response.JSON(http.StatusOK, openToggles)
}
