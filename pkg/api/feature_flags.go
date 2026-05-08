package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

// GetFeatureFlagsCatalog returns all feature flags registered in this Grafana build and whether each is enabled.
func (hs *HTTPServer) GetFeatureFlagsCatalog(c *contextmodel.ReqContext) response.Response {
	ctx := c.Req.Context()
	if fm, ok := hs.Features.(*featuremgmt.FeatureManager); ok {
		flags := fm.GetFlags()
		entries := make([]dtos.FeatureFlagCatalogEntry, 0, len(flags))
		for _, f := range flags {
			entries = append(entries, dtos.FeatureFlagCatalogEntry{
				Name:        f.Name,
				Description: f.Description,
				Stage:       f.Stage.String(),
				Enabled:     fm.IsEnabled(ctx, f.Name),
			})
		}
		sort.Slice(entries, func(i, j int) bool {
			return entries[i].Name < entries[j].Name
		})
		return response.JSON(http.StatusOK, dtos.FeatureFlagCatalogDTO{Flags: entries})
	}

	// Fallback for tests or alternate FeatureToggles implementations: only enabled flags are known.
	enabled := hs.Features.GetEnabled(ctx)
	entries := make([]dtos.FeatureFlagCatalogEntry, 0, len(enabled))
	for name := range enabled {
		entries = append(entries, dtos.FeatureFlagCatalogEntry{
			Name:    name,
			Enabled: true,
		})
	}
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name < entries[j].Name
	})
	return response.JSON(http.StatusOK, dtos.FeatureFlagCatalogDTO{Flags: entries})
}
