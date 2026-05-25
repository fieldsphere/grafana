package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web"
)

func TestGetOpenFeatureToggles(t *testing.T) {
	hs := setupSimpleHTTPServer(featuremgmt.WithFeatures())

	req, err := http.NewRequest(http.MethodGet, "/api/feature-toggles/open", nil)
	require.NoError(t, err)

	recorder := httptest.NewRecorder()
	c := &contextmodel.ReqContext{
		Context: &web.Context{
			Resp: web.NewResponseWriter(http.MethodGet, recorder),
			Req:  req,
		},
		SignedInUser: &user.SignedInUser{
			UserID:  1,
			OrgID:   1,
			OrgRole: org.RoleAdmin,
		},
	}

	resp := hs.GetOpenFeatureToggles(c)
	require.Equal(t, http.StatusOK, resp.Status())

	var toggles []OpenFeatureToggleDTO
	err = json.Unmarshal(resp.Body(), &toggles)
	require.NoError(t, err)
	require.NotEmpty(t, toggles)

	for _, toggle := range toggles {
		require.True(t, isOpenFeatureStage(toggle.Stage), "toggle %s should be open", toggle.Name)
		require.NotEmpty(t, toggle.Name)
	}
}

func TestGetOpenFeatureToggles_IncludesEnabledState(t *testing.T) {
	hs := setupSimpleHTTPServer(featuremgmt.WithFeatures("panelTitleSearch"))

	req, err := http.NewRequest(http.MethodGet, "/api/feature-toggles/open", nil)
	require.NoError(t, err)

	recorder := httptest.NewRecorder()
	c := &contextmodel.ReqContext{
		Context: &web.Context{
			Resp: web.NewResponseWriter(http.MethodGet, recorder),
			Req:  req,
		},
		SignedInUser: &user.SignedInUser{
			UserID:  1,
			OrgID:   1,
			OrgRole: org.RoleAdmin,
		},
	}

	resp := hs.GetOpenFeatureToggles(c)
	require.Equal(t, http.StatusOK, resp.Status())

	var toggles []OpenFeatureToggleDTO
	err = json.Unmarshal(resp.Body(), &toggles)
	require.NoError(t, err)

	var panelTitleSearch *OpenFeatureToggleDTO
	for i := range toggles {
		if toggles[i].Name == "panelTitleSearch" {
			panelTitleSearch = &toggles[i]
			break
		}
	}

	require.NotNil(t, panelTitleSearch)
	require.True(t, panelTitleSearch.Enabled)
}

func TestIsOpenFeatureStage(t *testing.T) {
	require.False(t, isOpenFeatureStage("GA"))
	require.False(t, isOpenFeatureStage("deprecated"))
	require.True(t, isOpenFeatureStage("preview"))
	require.True(t, isOpenFeatureStage("experimental"))
}
