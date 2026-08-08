package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/setting"
)

type LabsFeatureFlag struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Enabled         bool   `json:"enabled"`
	FrontendOnly    bool   `json:"frontendOnly"`
	RequiresRestart bool   `json:"requiresRestart"`
	RuntimeEditable bool   `json:"runtimeEditable"`
	Configured      bool   `json:"configured"`
	Source          string `json:"source"`
}

type LabsFeatureFlagsResponse struct {
	Flags                    []LabsFeatureFlag `json:"flags"`
	RuntimeTogglingSupported bool              `json:"runtimeTogglingSupported"`
	Message                  string            `json:"message"`
}

func (hs *HTTPServer) AdminGetFeatureFlags(c *contextmodel.ReqContext) response.Response {
	featureList, err := featuremgmt.GetEmbeddedFeatureList()
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to load feature metadata", err)
	}

	configuredFlags, err := setting.ReadFeatureTogglesFromInitFile(hs.Cfg.Raw.Section("feature_toggles"))
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to read configured feature flags", err)
	}

	enabledFlags := hs.Features.GetEnabled(c.Req.Context())
	flags := make([]LabsFeatureFlag, 0, len(featureList.Items))

	for _, feature := range featureList.Items {
		if feature.Name == "" {
			continue
		}

		_, configured := configuredFlags[feature.Name]
		source := "default-disabled"
		if configured {
			source = "configured"
		} else if feature.Spec.Expression == "true" {
			source = "default-enabled"
		}

		flags = append(flags, LabsFeatureFlag{
			Name:            feature.Name,
			Description:     feature.Spec.Description,
			Stage:           feature.Spec.Stage,
			Enabled:         enabledFlags[feature.Name],
			FrontendOnly:    feature.Spec.FrontendOnly,
			RequiresRestart: feature.Spec.RequiresRestart,
			RuntimeEditable: false,
			Configured:      configured,
			Source:          source,
		})
	}

	sort.Slice(flags, func(i, j int) bool {
		return flags[i].Name < flags[j].Name
	})

	return response.JSON(http.StatusOK, LabsFeatureFlagsResponse{
		Flags:                    flags,
		RuntimeTogglingSupported: false,
		Message:                  "Feature flags are currently read-only in the UI. Update configuration and restart Grafana to apply changes.",
	})
}
