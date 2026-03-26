package api

import (
	"context"
	"net/http"
	"slices"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

type labsFeatureToggle struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Stage       string `json:"stage"`
	Enabled     bool   `json:"enabled"`
}

type labsFeatureTogglesResponse struct {
	Toggles []labsFeatureToggle `json:"toggles"`
}

func (hs *HTTPServer) GetLabsFeatureToggles(c *contextmodel.ReqContext) response.Response {
	flagsProvider, ok := hs.Features.(interface {
		GetFlags() []featuremgmt.FeatureFlag
	})
	if !ok {
		return response.JSON(http.StatusOK, labsFeatureTogglesResponse{Toggles: []labsFeatureToggle{}})
	}

	flags := flagsProvider.GetFlags()
	toggles := make([]labsFeatureToggle, 0, len(flags))
	ctx := context.Background()
	if c != nil && c.Req != nil {
		ctx = c.Req.Context()
	}
	for _, flag := range flags {
		toggles = append(toggles, labsFeatureToggle{
			Name:        flag.Name,
			Description: flag.Description,
			Stage:       flag.Stage.String(),
			Enabled:     hs.Features.IsEnabled(ctx, flag.Name),
		})
	}

	slices.SortFunc(toggles, func(a, b labsFeatureToggle) int {
		switch {
		case a.Name < b.Name:
			return -1
		case a.Name > b.Name:
			return 1
		default:
			return 0
		}
	})

	return response.JSON(http.StatusOK, labsFeatureTogglesResponse{Toggles: toggles})
}
