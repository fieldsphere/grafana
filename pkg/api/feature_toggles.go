package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

type FeatureToggleListItem struct {
	Name            string                       `json:"name"`
	Description     string                       `json:"description"`
	Stage           featuremgmt.FeatureFlagStage `json:"stage"`
	Enabled         bool                         `json:"enabled"`
	Expression      string                       `json:"expression"`
	FrontendOnly    bool                         `json:"frontendOnly"`
	RequiresDevMode bool                         `json:"requiresDevMode"`
	RequiresRestart bool                         `json:"requiresRestart"`
}

type FeatureToggleListResponse struct {
	Toggles []FeatureToggleListItem `json:"toggles"`
}

func (hs *HTTPServer) GetFeatureTogglesList(c *contextmodel.ReqContext) response.Response {
	fm, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusNotImplemented, "Feature toggle registry not available", nil)
	}

	flags := fm.GetFlags()
	out := make([]FeatureToggleListItem, 0, len(flags))
	ctx := c.Req.Context()

	for _, f := range flags {
		out = append(out, FeatureToggleListItem{
			Name:            f.Name,
			Description:     f.Description,
			Stage:           f.Stage,
			Enabled:         hs.Features.IsEnabled(ctx, f.Name),
			Expression:      f.Expression,
			FrontendOnly:    f.FrontendOnly,
			RequiresDevMode: f.RequiresDevMode,
			RequiresRestart: f.RequiresRestart,
		})
	}

	sort.Slice(out, func(i, j int) bool {
		return out[i].Name < out[j].Name
	})

	return response.JSON(http.StatusOK, FeatureToggleListResponse{Toggles: out})
}
