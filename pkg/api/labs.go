package api

import (
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

func (hs *HTTPServer) registerLabsAPI(apiRoute routing.RouteRegister) {
	authorize := ac.Middleware(hs.AccessControl)

	apiRoute.Get(
		"/api/labs/feature-toggles",
		authorize(ac.EvalPermission(ac.ActionSettingsRead, ac.ScopeSettingsAll)),
		routing.Wrap(hs.getLabsFeatureToggles),
	)
}

func (hs *HTTPServer) getLabsFeatureToggles(c *contextmodel.ReqContext) response.Response {
	return response.JSON(http.StatusOK, featuremgmt.ResolveToggleState(c.Req.Context(), hs.Features))
}
