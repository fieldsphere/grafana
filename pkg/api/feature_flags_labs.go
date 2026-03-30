package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

// labsFeatureFlagItem is the JSON shape for the Labs feature flags page.
type labsFeatureFlagItem struct {
	Name            string `json:"name"`
	Description     string `json:"description,omitempty"`
	Stage           string `json:"stage"`
	Enabled         bool   `json:"enabled"`
	RequiresDevMode bool   `json:"requiresDevMode,omitempty"`
	FrontendOnly    bool   `json:"frontendOnly,omitempty"`
	RequiresRestart bool   `json:"requiresRestart,omitempty"`
}

// swagger:response featureFlagsLabsResponse
type featureFlagsLabsResponse struct {
	// in: body
	Body struct {
		Flags []labsFeatureFlagItem `json:"flags"`
	}
}

// swagger:route GET /featuremgmt/labs-flags feature_flags_labs getLabsFeatureFlags
//
// # List all registered feature flags and their current enabled state (Grafana Labs page)
//
// Requires org admin or feature management read permission.
//
// Responses:
//
//	200: featureFlagsLabsResponse
//	401: unauthorizedError
//	403: forbiddenError
//	500: internalServerError
func (hs *HTTPServer) GetLabsFeatureFlags(c *contextmodel.ReqContext) response.Response {
	fm, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Unable to list feature flags", nil)
	}

	defs := fm.GetFlags()
	sort.Slice(defs, func(i, j int) bool {
		return defs[i].Name < defs[j].Name
	})

	ctx := c.Req.Context()
	out := make([]labsFeatureFlagItem, 0, len(defs))
	for i := range defs {
		f := defs[i]
		out = append(out, labsFeatureFlagItem{
			Name:            f.Name,
			Description:     f.Description,
			Stage:           f.Stage.String(),
			Enabled:         fm.IsEnabled(ctx, f.Name),
			RequiresDevMode: f.RequiresDevMode,
			FrontendOnly:    f.FrontendOnly,
			RequiresRestart: f.RequiresRestart,
		})
	}

	return response.JSON(http.StatusOK, map[string]any{"flags": out})
}
