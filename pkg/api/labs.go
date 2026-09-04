package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

// LabsFeatureToggleDTO describes an open (non-GA) feature flag for the Labs page.
type LabsFeatureToggleDTO struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Stage       string `json:"stage"`
	Enabled     bool   `json:"enabled"`
}

func isOpenFeatureStage(stage string) bool {
	switch stage {
	case "experimental", "preview", "privatePreview":
		return true
	default:
		return false
	}
}

// swagger:route GET /labs/feature-toggles signed_in getLabsFeatureToggles
//
// Get open feature toggles.
//
// Returns feature toggles that are in an experimental or preview stage.
//
// Responses:
// 200: getLabsFeatureTogglesResponse
// 401: unauthorisedError
func (hs *HTTPServer) GetLabsFeatureToggles(c *contextmodel.ReqContext) response.Response {
	featureList, err := featuremgmt.GetEmbeddedFeatureList()
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to load feature toggles", err)
	}

	enabled := hs.Features.GetEnabled(c.Req.Context())
	toggles := make([]LabsFeatureToggleDTO, 0)

	for _, item := range featureList.Items {
		if !isOpenFeatureStage(item.Spec.Stage) {
			continue
		}

		toggles = append(toggles, LabsFeatureToggleDTO{
			Name:        item.Name,
			Description: item.Spec.Description,
			Stage:       item.Spec.Stage,
			Enabled:     enabled[item.Name],
		})
	}

	sort.Slice(toggles, func(i, j int) bool {
		return toggles[i].Name < toggles[j].Name
	})

	return response.JSON(http.StatusOK, toggles)
}

// swagger:response getLabsFeatureTogglesResponse
type GetLabsFeatureTogglesResponse struct {
	// in:body
	Body []LabsFeatureToggleDTO `json:"body"`
}
