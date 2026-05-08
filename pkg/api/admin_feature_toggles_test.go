package api

import (
	"encoding/json"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/infra/db/dbtest"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/anonymous/anontest"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/stats/statstest"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestAdmin_GetResolvedFeatureToggles(t *testing.T) {
	t.Run("requires settings:* scope", func(t *testing.T) {
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = setting.NewCfg()
			hs.SQLStore = dbtest.NewFakeDB()
			hs.SettingsProvider = &setting.OSSImpl{Cfg: hs.Cfg}
			hs.statsService = statstest.NewFakeService()
			hs.anonService = anontest.NewFakeService()
		})

		res, err := server.Send(webtest.RequestWithSignedInUser(server.NewGetRequest("/api/admin/feature-toggles/resolved"), userWithPermissions(1, []accesscontrol.Permission{
			{Action: accesscontrol.ActionSettingsRead, Scope: "settings:auth.saml:*"},
		})))
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, res.StatusCode)
		require.NoError(t, res.Body.Close())
	})

	t.Run("returns registry toggles for settings:*", func(t *testing.T) {
		fm, err := featuremgmt.ProvideManagerService(setting.NewCfg())
		require.NoError(t, err)

		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = setting.NewCfg()
			hs.SQLStore = dbtest.NewFakeDB()
			hs.SettingsProvider = &setting.OSSImpl{Cfg: hs.Cfg}
			hs.statsService = statstest.NewFakeService()
			hs.anonService = anontest.NewFakeService()
			hs.Features = fm
		})

		res, err := server.Send(webtest.RequestWithSignedInUser(server.NewGetRequest("/api/admin/feature-toggles/resolved"), userWithPermissions(1, []accesscontrol.Permission{
			{Action: accesscontrol.ActionSettingsRead, Scope: accesscontrol.ScopeSettingsAll},
		})))
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)
		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		require.NoError(t, res.Body.Close())

		var parsed dtos.ResolvedFeatureTogglesDTO
		require.NoError(t, json.Unmarshal(body, &parsed))
		assert.False(t, parsed.AllowEditing)
		require.NotEmpty(t, parsed.Toggles)

		found := false
		for _, tg := range parsed.Toggles {
			if tg.Name == "panelTitleSearch" {
				found = true
				assert.False(t, tg.Writeable)
				break
			}
		}
		require.True(t, found, "expected standard registry flag panelTitleSearch in response")
	})
}
