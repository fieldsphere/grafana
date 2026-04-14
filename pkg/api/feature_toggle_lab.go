package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/apimachinery/apis/common/v0alpha1"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
	"github.com/grafana/grafana/pkg/web"
)

type labsFeatureToggleUpdateDTO struct {
	Enabled bool `json:"enabled"`
}

func (hs *HTTPServer) AdminGetLabsFeatureToggles(c *contextmodel.ReqContext) response.Response {
	fm, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Feature manager unavailable", nil)
	}

	state := buildResolvedLabsToggleState(fm)
	return response.JSON(http.StatusOK, state)
}

func (hs *HTTPServer) AdminPutLabsFeatureToggle(c *contextmodel.ReqContext) response.Response {
	fm, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Feature manager unavailable", nil)
	}

	flagName := web.Params(c.Req)[":name"]
	if flagName == "" {
		return response.Error(http.StatusBadRequest, "Missing flag name", nil)
	}

	var body labsFeatureToggleUpdateDTO
	if err := web.Bind(c.Req, &body); err != nil {
		return response.Error(http.StatusBadRequest, "Invalid request body", err)
	}

	if err := upsertLabsFeatureToggle(c.Req.Context(), hs.SQLStore, fm, flagName, body.Enabled); err != nil {
		return response.Error(http.StatusBadRequest, err.Error(), err)
	}

	state := buildResolvedLabsToggleState(fm)
	return response.JSON(http.StatusOK, state)
}

func (hs *HTTPServer) AdminDeleteLabsFeatureToggle(c *contextmodel.ReqContext) response.Response {
	fm, ok := hs.Features.(*featuremgmt.FeatureManager)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Feature manager unavailable", nil)
	}

	flagName := web.Params(c.Req)[":name"]
	if flagName == "" {
		return response.Error(http.StatusBadRequest, "Missing flag name", nil)
	}

	if err := deleteLabsFeatureToggle(c.Req.Context(), hs.SQLStore, fm, flagName); err != nil {
		return response.Error(http.StatusBadRequest, err.Error(), err)
	}

	state := buildResolvedLabsToggleState(fm)
	return response.JSON(http.StatusOK, state)
}

func buildResolvedLabsToggleState(fm *featuremgmt.FeatureManager) *feature_toggle_api.ResolvedToggleState {
	flags := fm.GetFlags()
	lab := fm.LabOverrides()
	sort.Slice(flags, func(i, j int) bool {
		return flags[i].Name < flags[j].Name
	})

	restartRequired := false
	toggles := make([]feature_toggle_api.ToggleStatus, 0, len(flags))
	enabledMap := make(map[string]bool)

	for _, f := range flags {
		effective := fm.IsEnabledGlobally(f.Name)
		enabledMap[f.Name] = effective

		writeable := isLabsWritableFlag(f)
		if _, hasLab := lab[f.Name]; hasLab {
			if f.RequiresRestart {
				restartRequired = true
			}
		}

		ts := feature_toggle_api.ToggleStatus{
			Name:        f.Name,
			Description: f.Description,
			Stage:       f.Stage.String(),
			Enabled:     effective,
			Writeable:   writeable,
		}
		if w, ok := fm.WarningForFlag(f.Name); ok {
			ts.Warning = w
		}
		if _, hasLab := lab[f.Name]; hasLab {
			ts.Source = &v0alpha1.ObjectReference{Kind: "LabsOverride", Name: f.Name}
		}
		toggles = append(toggles, ts)
	}

	return &feature_toggle_api.ResolvedToggleState{
		AllowEditing:    true,
		RestartRequired: restartRequired,
		Enabled:         enabledMap,
		Toggles:         toggles,
	}
}

func isLabsWritableFlag(f featuremgmt.FeatureFlag) bool {
	if f.RequiresDevMode {
		return false
	}
	if f.FrontendOnly {
		return true
	}
	return false
}
