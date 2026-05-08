package api

import (
	"net/http"
	"slices"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

// labsFeatureFlagDTO describes a registered feature toggle for the Labs UI.
type labsFeatureFlagDTO struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	Stage        string `json:"stage"`
	Enabled      bool   `json:"enabled"`
	FrontendOnly bool   `json:"frontendOnly"`
}

// GET /api/labs/feature-toggles
func (hs *HTTPServer) GetLabsFeatureToggles(c *contextmodel.ReqContext) response.Response {
	fm, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.JSON(http.StatusOK, []labsFeatureFlagDTO{})
	}

	flags := fm.GetFlags()
	rows := make([]labsFeatureFlagDTO, 0, len(flags))
	for _, f := range flags {
		if f.HideFromDocs {
			continue
		}
		rows = append(rows, labsFeatureFlagDTO{
			Name:         f.Name,
			Description:  f.Description,
			Stage:        f.Stage.String(),
			Enabled:      hs.Features.IsEnabledGlobally(f.Name),
			FrontendOnly: f.FrontendOnly,
		})
	}
	slices.SortFunc(rows, func(a, b labsFeatureFlagDTO) int {
		if a.Name < b.Name {
			return -1
		}
		if a.Name > b.Name {
			return 1
		}
		return 0
	})

	return response.JSON(http.StatusOK, rows)
}
