package api

import (
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

// GetFeatureFlags returns all registered feature flags and their current enabled state.
func (hs *HTTPServer) GetFeatureFlags(c *contextmodel.ReqContext) response.Response {
	fm, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusServiceUnavailable, "feature flags are not available", nil)
	}

	return response.JSON(http.StatusOK, fm.GetFlagsWithState())
}
