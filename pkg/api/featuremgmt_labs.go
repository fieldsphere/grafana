package api

import (
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

// GET /api/featuremgmt/registered-flags
func (hs *HTTPServer) GetRegisteredFeatureFlags(c *contextmodel.ReqContext) response.Response {
	if !c.IsSignedIn {
		return response.Error(http.StatusUnauthorized, "Unauthorized", nil)
	}

	provider, ok := hs.Features.(featuremgmt.RegisteredFeatureFlagsProvider)
	if !ok {
		return response.JSON(http.StatusOK, []featuremgmt.RegisteredFeatureFlag{})
	}

	return response.JSON(http.StatusOK, provider.GetRegisteredFeatureFlags(c.Req.Context()))
}
