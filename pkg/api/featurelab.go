package api

import (
	"net/http"

	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/web"
	"github.com/grafana/grafana/pkg/api/response"
)

type featureFlagDTO struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Enabled     bool   `json:"enabled"`
	Stage       string `json:"stage"`
}

func (hs *HTTPServer) GetFeatureToggles(c *contextmodel.ReqContext) response.Response {
	fm, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Feature management not available", nil)
	}

	flags := fm.GetFlags()
	enabled := fm.GetEnabled(c.Req.Context())

	result := make([]featureFlagDTO, 0, len(flags))
	for _, f := range flags {
		result = append(result, featureFlagDTO{
			Name:        f.Name,
			Description: f.Description,
			Enabled:     enabled[f.Name],
			Stage:       f.Stage.String(),
		})
	}

	return response.JSON(http.StatusOK, result)
}

type updateFeatureToggleRequest struct {
	Enabled bool `json:"enabled"`
}

func (hs *HTTPServer) UpdateFeatureToggle(c *contextmodel.ReqContext) response.Response {
	fm, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Feature management not available", nil)
	}

	name := web.Params(c.Req)[":name"]

	var req updateFeatureToggleRequest
	if err := web.Bind(c.Req, &req); err != nil {
		return response.Error(http.StatusBadRequest, "Invalid request body", err)
	}

	if err := fm.SetEnabled(name, req.Enabled); err != nil {
		return response.Error(http.StatusNotFound, err.Error(), err)
	}

	return response.JSON(http.StatusOK, map[string]any{"message": "Feature toggle updated"})
}
