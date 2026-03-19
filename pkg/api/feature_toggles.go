package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	featuretoggleapi "github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
)

func (hs *HTTPServer) GetFeatureToggles(c *contextmodel.ReqContext) response.Response {
	c, span := hs.injectSpan(c, "api.GetFeatureToggles")
	defer span.End()

	enabled := hs.Features.GetEnabled(c.Req.Context())
	statuses := make([]featuretoggleapi.ToggleStatus, 0, len(enabled))

	if manager, ok := hs.Features.(*featuremgmt.FeatureManager); ok {
		flags := manager.GetFlags()
		sort.Slice(flags, func(i, j int) bool {
			return flags[i].Name < flags[j].Name
		})

		statuses = make([]featuretoggleapi.ToggleStatus, 0, len(flags))
		for _, flag := range flags {
			statuses = append(statuses, featuretoggleapi.ToggleStatus{
				Name:        flag.Name,
				Description: flag.Description,
				Stage:       flag.Stage.String(),
				Enabled:     enabled[flag.Name],
			})
		}
	} else {
		names := make([]string, 0, len(enabled))
		for name := range enabled {
			names = append(names, name)
		}
		sort.Strings(names)

		for _, name := range names {
			statuses = append(statuses, featuretoggleapi.ToggleStatus{
				Name:    name,
				Enabled: enabled[name],
			})
		}
	}

	return response.JSON(http.StatusOK, featuretoggleapi.ResolvedToggleState{
		Enabled: enabled,
		Toggles: statuses,
	})
}
