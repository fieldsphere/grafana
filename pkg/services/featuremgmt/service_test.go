package featuremgmt

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/setting"
)

func TestFeatureService(t *testing.T) {
	cfg := setting.NewCfg()
	mgmt, err := ProvideManagerService(cfg)
	require.NoError(t, err)
	require.NotNil(t, mgmt)

	// Enterprise features do not fall though automatically
	require.False(t, mgmt.IsEnabledGlobally("a.yes.default"))
	require.False(t, mgmt.IsEnabledGlobally("a.yes")) // licensed, but not enabled
}

func TestGetEmbeddedFeatureListReturnsIndependentItemsSlice(t *testing.T) {
	first, err := GetEmbeddedFeatureList()
	require.NoError(t, err)
	require.NotEmpty(t, first.Items)

	originalDescription := first.Items[0].Spec.Description
	first.Items[0].Spec.Description = "mutated-description"

	second, err := GetEmbeddedFeatureList()
	require.NoError(t, err)
	require.NotEmpty(t, second.Items)
	require.Equal(t, originalDescription, second.Items[0].Spec.Description)
}
