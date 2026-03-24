package api

import (
	"net/http"
	"slices"
	"strings"

	"github.com/grafana/grafana/pkg/api/response"
	common "github.com/grafana/grafana/pkg/apimachinery/apis/common/v0alpha1"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	featuretoggleapi "github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
	"github.com/grafana/grafana/pkg/setting"
)

func (hs *HTTPServer) GetLabsFeatureToggles(c *contextmodel.ReqContext) response.Response {
	featureList, err := featuremgmt.GetEmbeddedFeatureList()
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to load feature toggle registry", err)
	}

	configuredFlags, err := setting.ReadFeatureTogglesFromInitFile(hs.Cfg.Raw.Section("feature_toggles"))
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to read configured feature toggles", err)
	}

	configuredFlagNames := make(map[string]struct{}, len(configuredFlags))
	for name := range configuredFlags {
		if name == "enable" {
			continue
		}
		configuredFlagNames[name] = struct{}{}
	}

	statuses := make([]featuretoggleapi.ToggleStatus, 0, len(featureList.Items)+len(configuredFlagNames))
	for _, feature := range featureList.Items {
		delete(configuredFlagNames, feature.Name)
		statuses = append(statuses, featuretoggleapi.ToggleStatus{
			Name:        feature.Name,
			Description: feature.Spec.Description,
			Stage:       feature.Spec.Stage,
			Enabled:     hs.Features.IsEnabled(c.Req.Context(), feature.Name),
			Writeable:   false,
		})
	}

	if len(configuredFlagNames) > 0 {
		unknownSource := &common.ObjectReference{
			Kind: "ConfigFile",
			Name: "feature_toggles",
		}

		for name := range configuredFlagNames {
			statuses = append(statuses, featuretoggleapi.ToggleStatus{
				Name:      name,
				Enabled:   hs.Features.IsEnabled(c.Req.Context(), name),
				Writeable: false,
				Source:    unknownSource,
				Warning:   "Unknown flag configured in [feature_toggles]",
			})
		}
	}

	slices.SortFunc(statuses, func(a, b featuretoggleapi.ToggleStatus) int {
		switch {
		case a.Enabled == b.Enabled:
			return strings.Compare(a.Name, b.Name)
		case a.Enabled:
			return -1
		default:
			return 1
		}
	})

	return response.JSON(http.StatusOK, featuretoggleapi.ResolvedToggleState{
		Enabled: hs.Features.GetEnabled(c.Req.Context()),
		Toggles: statuses,
	})
}
