package api

import (
	"context"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"

	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/web"
)

func TestGetFeatureToggleDTOs(t *testing.T) {
	features := featuremgmt.NewMockFeatureToggles(t)
	features.EXPECT().GetEnabled(context.Background()).Return(map[string]bool{
		"gaFlag": true,
	})
	features.EXPECT().GetFlags().Return([]featuremgmt.FeatureFlag{
		{
			Name:            "zPreviewFlag",
			Description:     "Preview feature",
			Stage:           featuremgmt.FeatureStagePublicPreview,
			FrontendOnly:    true,
			RequiresRestart: false,
		},
		{
			Name:            "gaFlag",
			Description:     "GA feature",
			Stage:           featuremgmt.FeatureStageGeneralAvailability,
			FrontendOnly:    false,
			RequiresRestart: true,
		},
	})

	req := httptest.NewRequest("GET", "/api/feature-toggles", nil)
	reqCtx := &contextmodel.ReqContext{
		Context: &web.Context{Req: req},
	}
	hs := &HTTPServer{Features: features}

	toggles := getFeatureToggleDTOs(reqCtx, hs)

	require.Len(t, toggles, 2)
	require.Equal(t, "gaFlag", toggles[0].Name)
	require.True(t, toggles[0].Enabled)
	require.Equal(t, "GA", toggles[0].Stage)
	require.True(t, toggles[0].RequiresRestart)
	require.Equal(t, "zPreviewFlag", toggles[1].Name)
	require.False(t, toggles[1].Enabled)
	require.Equal(t, "preview", toggles[1].Stage)
	require.True(t, toggles[1].FrontendOnly)
}

func TestGetFeatureToggles(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/feature-toggles", nil)
	reqCtx := &contextmodel.ReqContext{
		Context: &web.Context{Req: req},
	}
	hs := &HTTPServer{
		Features: featuremgmt.WithFeatures("enabledFlag"),
	}

	resp := hs.GetFeatureToggles(reqCtx)

	require.Equal(t, 200, resp.Status())

	var body FeatureTogglesDTO
	require.NoError(t, json.Unmarshal(resp.Body(), &body))
	require.NotEmpty(t, body.Toggles)

	var found bool
	for _, toggle := range body.Toggles {
		if toggle.Name == "enabledFlag" {
			found = true
			require.True(t, toggle.Enabled)
		}
	}
	require.True(t, found)
}
