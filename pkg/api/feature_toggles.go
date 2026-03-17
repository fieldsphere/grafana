package api

import (
	"net/http"
	"slices"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
)

type FeatureToggleDTO struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Enabled         bool   `json:"enabled"`
	FrontendOnly    bool   `json:"frontendOnly"`
	RequiresRestart bool   `json:"requiresRestart"`
}

type FeatureTogglesDTO struct {
	Toggles []FeatureToggleDTO `json:"toggles"`
}

func (hs *HTTPServer) GetFeatureToggles(c *contextmodel.ReqContext) response.Response {
	return response.JSON(http.StatusOK, FeatureTogglesDTO{Toggles: getFeatureToggleDTOs(c, hs)})
}

func getFeatureToggleDTOs(c *contextmodel.ReqContext, hs *HTTPServer) []FeatureToggleDTO {
	enabled := hs.Features.GetEnabled(c.Req.Context())
	flags := hs.Features.GetFlags()

	toggles := make([]FeatureToggleDTO, 0, len(flags))
	for _, flag := range flags {
		toggles = append(toggles, FeatureToggleDTO{
			Name:            flag.Name,
			Description:     flag.Description,
			Stage:           flag.Stage.String(),
			Enabled:         enabled[flag.Name],
			FrontendOnly:    flag.FrontendOnly,
			RequiresRestart: flag.RequiresRestart,
		})
	}

	slices.SortFunc(toggles, func(a, b FeatureToggleDTO) int {
		switch {
		case a.Name < b.Name:
			return -1
		case a.Name > b.Name:
			return 1
		default:
			return 0
		}
	})

	return toggles
}
