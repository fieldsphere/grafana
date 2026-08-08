package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

type labsFeatureToggleDTO struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Stage       string `json:"stage"`
	Enabled     bool   `json:"enabled"`
}

// swagger:route GET /labs/feature-toggles signed_in_user getLabsFeatureToggles
//
// Get all feature toggles for the Labs page.
//
// Responses:
// 200: labsFeatureTogglesResponse
// 401: unauthorisedError
// 500: internalServerError
func (hs *HTTPServer) GetLabsFeatureToggles(c *contextmodel.ReqContext) response.Response {
	fm, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Feature manager not available", nil)
	}

	flags := fm.GetFlags()
	enabled := hs.Features.GetEnabled(c.Req.Context())

	toggles := make([]labsFeatureToggleDTO, 0, len(flags))
	for _, flag := range flags {
		toggles = append(toggles, labsFeatureToggleDTO{
			Name:        flag.Name,
			Description: flag.Description,
			Stage:       flag.Stage.String(),
			Enabled:     enabled[flag.Name],
		})
	}

	sort.Slice(toggles, func(i, j int) bool {
		return toggles[i].Name < toggles[j].Name
	})

	return response.JSON(http.StatusOK, toggles)
}
