package api

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

func TestGetLabsFeatureToggles(t *testing.T) {
	hs := &HTTPServer{
		Features: featuremgmt.WithManager("alpha", true, "beta", false),
	}

	resp := hs.GetLabsFeatureToggles(nil)

	require.Equal(t, 200, resp.Status())

	var body labsFeatureTogglesResponse
	require.NoError(t, json.Unmarshal(resp.Body(), &body))
	require.Len(t, body.Toggles, 2)

	require.Equal(t, "alpha", body.Toggles[0].Name)
	require.True(t, body.Toggles[0].Enabled)
	require.Equal(t, "unknown", body.Toggles[0].Stage)

	require.Equal(t, "beta", body.Toggles[1].Name)
	require.False(t, body.Toggles[1].Enabled)
	require.Equal(t, "unknown", body.Toggles[1].Stage)
}
