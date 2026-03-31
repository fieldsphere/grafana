package api

import (
	"context"
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

// FeatureFlagCatalogItem is a feature flag definition with current enabled state for the Labs UI.
type FeatureFlagCatalogItem struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Enabled         bool   `json:"enabled"`
	Expression      string `json:"expression"`
	RequiresDevMode bool   `json:"requiresDevMode"`
	FrontendOnly    bool   `json:"frontend"`
	RequiresRestart bool   `json:"requiresRestart"`
}

type featureFlagCatalogResponse struct {
	FeatureFlags []FeatureFlagCatalogItem `json:"featureFlags"`
}

// GET /api/featuremgmt/toggles
func (hs *HTTPServer) GetFeatureFlagCatalog(c *contextmodel.ReqContext) response.Response {
	ctx := c.Req.Context()
	defs := hs.Features.GetFlags()
	if defs == nil {
		defs = []featuremgmt.FeatureFlag{}
	}

	enabled := hs.Features.GetEnabled(ctx)
	items := make([]FeatureFlagCatalogItem, 0, len(defs))
	for _, def := range defs {
		if def.HideFromDocs {
			continue
		}
		items = append(items, FeatureFlagCatalogItem{
			Name:            def.Name,
			Description:     def.Description,
			Stage:           def.Stage.String(),
			Enabled:         isFlagEnabled(ctx, hs.Features, enabled, def.Name),
			Expression:      def.Expression,
			RequiresDevMode: def.RequiresDevMode,
			FrontendOnly:    def.FrontendOnly,
			RequiresRestart: def.RequiresRestart,
		})
	}

	sort.Slice(items, func(i, j int) bool { return items[i].Name < items[j].Name })

	return response.JSON(http.StatusOK, featureFlagCatalogResponse{FeatureFlags: items})
}

func isFlagEnabled(ctx context.Context, ft featuremgmt.FeatureToggles, enabledMap map[string]bool, name string) bool {
	if enabledMap != nil {
		if v, ok := enabledMap[name]; ok {
			return v
		}
	}
	return ft.IsEnabled(ctx, name)
}
