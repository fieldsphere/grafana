package migrations

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/setting"
)

func TestIsG12DualwriteResource(t *testing.T) {
	require.True(t, isG12DualwriteResource(setting.FolderResource))
	require.True(t, isG12DualwriteResource(setting.DashboardResource))
	require.False(t, isG12DualwriteResource(setting.LibraryPanelResource))
	require.False(t, isG12DualwriteResource(setting.SnapshotResource))
	require.False(t, isG12DualwriteResource(""))
}
