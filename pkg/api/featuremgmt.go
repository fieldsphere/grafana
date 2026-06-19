package api

import (
	"context"
	"errors"
	"net/http"

	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	featuretoggleapi "github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
)

type resolvedFeatureToggles interface {
	GetResolvedState(ctx context.Context) featuretoggleapi.ResolvedToggleState
}

func (hs *HTTPServer) GetFeatureToggles(c *contextmodel.ReqContext) {
	toggles, ok := hs.Features.(resolvedFeatureToggles)
	if !ok {
		c.JsonApiErr(http.StatusInternalServerError, "Feature toggle state is unavailable", errors.New("feature toggle state provider is unavailable"))
		return
	}

	c.JSON(http.StatusOK, toggles.GetResolvedState(c.Req.Context()))
}
