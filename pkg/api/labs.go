package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

type labsFeatureToggleDTO struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Enabled         bool   `json:"enabled"`
	FrontendOnly    bool   `json:"frontendOnly"`
	HideFromDocs    bool   `json:"hideFromDocs"`
	RequiresDevMode bool   `json:"requiresDevMode"`
	RequiresRestart bool   `json:"requiresRestart"`
	Expression      string `json:"expression"`
}

type labsFeatureTogglesResponse struct {
	ActiveCount    int                    `json:"activeCount"`
	AvailableCount int                    `json:"availableCount"`
	Toggles        []labsFeatureToggleDTO `json:"toggles"`
}

func (hs *HTTPServer) GetLabsFeatureToggles(c *contextmodel.ReqContext) response.Response {
	enabled := hs.Features.GetEnabled(c.Req.Context())
	flags := featuremgmt.GetStandardFeatureFlags()

	toggles := make([]labsFeatureToggleDTO, 0, len(flags))
	activeCount := 0
	for _, flag := range flags {
		isEnabled := enabled[flag.Name]
		if isEnabled {
			activeCount++
		}

		toggles = append(toggles, labsFeatureToggleDTO{
			Name:            flag.Name,
			Description:     flag.Description,
			Stage:           flag.Stage.String(),
			Enabled:         isEnabled,
			FrontendOnly:    flag.FrontendOnly,
			HideFromDocs:    flag.HideFromDocs,
			RequiresDevMode: flag.RequiresDevMode,
			RequiresRestart: flag.RequiresRestart,
			Expression:      flag.Expression,
		})
	}

	sort.SliceStable(toggles, func(i, j int) bool {
		if toggles[i].Enabled != toggles[j].Enabled {
			return toggles[i].Enabled
		}
		return toggles[i].Name < toggles[j].Name
	})

	return response.JSON(http.StatusOK, labsFeatureTogglesResponse{
		ActiveCount:    activeCount,
		AvailableCount: len(toggles),
		Toggles:        toggles,
	})
}
