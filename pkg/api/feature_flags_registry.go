package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

// featureFlagRegistryEntry is returned by GET /api/user/feature-flags/registry for the Labs UI.
type featureFlagRegistryEntry struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Expression      string `json:"expression"`
	RequiresDevMode bool   `json:"requiresDevMode"`
	FrontendOnly    bool   `json:"frontendOnly"`
	HideFromDocs    bool   `json:"hideFromDocs"`
	RequiresRestart bool   `json:"requiresRestart"`
	Enabled         bool   `json:"enabled"`
}

// GetFeatureFlagsRegistry returns all registered feature flags and whether each is enabled for this server.
func (hs *HTTPServer) GetFeatureFlagsRegistry(c *contextmodel.ReqContext) response.Response {
	fm, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Feature flags registry is unavailable", nil)
	}

	enabled := fm.GetEnabled(c.Req.Context())
	flags := fm.GetFlags()
	sort.Slice(flags, func(i, j int) bool {
		return flags[i].Name < flags[j].Name
	})

	out := make([]featureFlagRegistryEntry, 0, len(flags))
	isGrafanaAdmin := c.SignedInUser != nil && c.SignedInUser.GetIsGrafanaAdmin()
	for _, f := range flags {
		if !isGrafanaAdmin && (f.HideFromDocs || f.RequiresDevMode) {
			continue
		}

		out = append(out, featureFlagRegistryEntry{
			Name:            f.Name,
			Description:     f.Description,
			Stage:           f.Stage.String(),
			Expression:      f.Expression,
			RequiresDevMode: f.RequiresDevMode,
			FrontendOnly:    f.FrontendOnly,
			HideFromDocs:    f.HideFromDocs,
			RequiresRestart: f.RequiresRestart,
			Enabled:         enabled[f.Name],
		})
	}

	return response.JSON(http.StatusOK, out)
}
