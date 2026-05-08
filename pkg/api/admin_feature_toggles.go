package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

// GET /api/admin/feature-toggles/resolved
func (hs *HTTPServer) AdminGetResolvedFeatureToggles(c *contextmodel.ReqContext) response.Response {
	fm, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusNotImplemented, "Feature toggle registry not available", nil)
	}

	flags := fm.GetFlags()
	sort.Slice(flags, func(i, j int) bool {
		return flags[i].Name < flags[j].Name
	})

	warnings := fm.GetFlagWarnings()
	enabled := make(map[string]bool, len(flags))
	toggles := make([]dtos.FeatureToggleStatusDTO, 0, len(flags))

	for _, f := range flags {
		isEn := hs.Features.IsEnabledGlobally(f.Name)
		enabled[f.Name] = isEn
		warn := warnings[f.Name]
		toggles = append(toggles, dtos.FeatureToggleStatusDTO{
			Name:            f.Name,
			Description:     f.Description,
			Stage:           f.Stage.String(),
			Enabled:         isEn,
			Writeable:       false,
			Warning:         warn,
			RequiresRestart: f.RequiresRestart,
			FrontendOnly:    f.FrontendOnly,
			RequiresDevMode: f.RequiresDevMode,
			Expression:      f.Expression,
		})
	}

	return response.JSON(http.StatusOK, dtos.ResolvedFeatureTogglesDTO{
		AllowEditing:    false,
		RestartRequired: false,
		Enabled:         enabled,
		Toggles:         toggles,
	})
}
