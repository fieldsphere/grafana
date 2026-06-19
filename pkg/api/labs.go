package api

import (
	"net/http"
	"slices"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

type labsFeatureToggleDTO struct {
	Name             string `json:"name"`
	Description      string `json:"description"`
	Stage            string `json:"stage"`
	Owner            string `json:"owner,omitempty"`
	Enabled          bool   `json:"enabled"`
	EnabledByDefault bool   `json:"enabledByDefault"`
	FrontendOnly     bool   `json:"frontendOnly"`
	RequiresRestart  bool   `json:"requiresRestart"`
	RequiresDevMode  bool   `json:"requiresDevMode"`
	HideFromDocs     bool   `json:"hideFromDocs"`
}

type labsFeatureTogglesResponse struct {
	Toggles []labsFeatureToggleDTO `json:"toggles"`
}

func (hs *HTTPServer) GetLabsFeatureToggles(c *contextmodel.ReqContext) response.Response {
	featureList, err := featuremgmt.GetEmbeddedFeatureList()
	if err != nil {
		return response.ErrOrFallback(http.StatusInternalServerError, "Failed to load feature toggles", err)
	}

	enabledFlags := hs.Features.GetEnabled(c.Req.Context())
	toggles := make([]labsFeatureToggleDTO, 0, len(featureList.Items))

	for _, feature := range featureList.Items {
		toggles = append(toggles, labsFeatureToggleDTO{
			Name:             feature.Name,
			Description:      feature.Spec.Description,
			Stage:            feature.Spec.Stage,
			Owner:            feature.Spec.Owner,
			Enabled:          enabledFlags[feature.Name],
			EnabledByDefault: feature.Spec.Expression == "true",
			FrontendOnly:     feature.Spec.FrontendOnly,
			RequiresRestart:  feature.Spec.RequiresRestart,
			RequiresDevMode:  feature.Spec.RequiresDevMode,
			HideFromDocs:     feature.Spec.HideFromDocs,
		})
	}

	slices.SortFunc(toggles, func(a, b labsFeatureToggleDTO) int {
		if a.Name < b.Name {
			return -1
		}
		if a.Name > b.Name {
			return 1
		}
		return 0
	})

	return response.JSON(http.StatusOK, labsFeatureTogglesResponse{Toggles: toggles})
}
