package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

// FeatureToggleListItem is a single feature flag for the Labs UI and API consumers.
type FeatureToggleListItem struct {
	Name            string `json:"name"`
	Description     string `json:"description,omitempty"`
	Stage           string `json:"stage"`
	Enabled         bool   `json:"enabled"`
	RequiresDevMode bool   `json:"requiresDevMode,omitempty"`
	RequiresRestart bool   `json:"requiresRestart,omitempty"`
	FrontendOnly    bool   `json:"frontend,omitempty"`
	Expression      string `json:"expression,omitempty"`
}

// FeatureToggleListResponse is the body for GET /api/admin/feature-toggles.
type FeatureToggleListResponse struct {
	Flags []FeatureToggleListItem `json:"flags"`
}

func (hs *HTTPServer) AdminGetFeatureToggles(c *contextmodel.ReqContext) response.Response {
	fm, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Feature toggle service unavailable", nil)
	}

	ctx := c.Req.Context()
	defs := fm.GetFlags()
	items := make([]FeatureToggleListItem, 0, len(defs))
	for _, f := range defs {
		items = append(items, FeatureToggleListItem{
			Name:            f.Name,
			Description:     f.Description,
			Stage:           f.Stage.String(),
			Enabled:         hs.Features.IsEnabled(ctx, f.Name),
			RequiresDevMode: f.RequiresDevMode,
			RequiresRestart: f.RequiresRestart,
			FrontendOnly:    f.FrontendOnly,
			Expression:      f.Expression,
		})
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].Name < items[j].Name
	})

	return response.JSON(http.StatusOK, FeatureToggleListResponse{Flags: items})
}
