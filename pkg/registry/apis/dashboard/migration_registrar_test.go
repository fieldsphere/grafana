package dashboard

import (
	"testing"

	"github.com/stretchr/testify/require"
	"k8s.io/apimachinery/pkg/runtime/schema"

	dashV0 "github.com/grafana/grafana/apps/dashboard/pkg/apis/dashboard/v0alpha1"
	v1 "github.com/grafana/grafana/apps/dashboard/pkg/apis/dashboard/v1"
	folders "github.com/grafana/grafana/apps/folder/pkg/apis/folder/v1"
	dashboardmigrator "github.com/grafana/grafana/pkg/registry/apis/dashboard/migrator"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/storage/unified/migrations"
)

func TestFoldersDashboardsMigrationDoesNotRegisterLibraryPanels(t *testing.T) {
	def := FoldersDashboardsMigration(dashboardmigrator.ProvideFoldersDashboardsMigrator(nil))

	folderGR := schema.GroupResource{Group: folders.GROUP, Resource: folders.RESOURCE}
	dashboardGR := schema.GroupResource{Group: v1.GROUP, Resource: v1.DASHBOARD_RESOURCE}
	libraryPanelGR := schema.GroupResource{Group: v1.GROUP, Resource: v1.LIBRARY_PANEL_RESOURCE}

	require.Equal(t, migrations.FoldersDashboardsMigrationID, def.ID)
	require.ElementsMatch(t, []schema.GroupResource{folderGR, dashboardGR}, def.GetGroupResources())
	require.ElementsMatch(t, []string{
		setting.FolderResource,
		setting.DashboardResource,
	}, def.ConfigResources())
	require.Nil(t, def.GetMigratorFunc(libraryPanelGR), "library panels must use LibraryPanelsMigration")
	require.NotContains(t, def.GetLockTables(), "library_element")
}

func TestLibraryPanelsMigrationRegistersLibraryPanels(t *testing.T) {
	def := LibraryPanelsMigration(dashboardmigrator.ProvideFoldersDashboardsMigrator(nil))

	libraryPanelGR := schema.GroupResource{Group: v1.GROUP, Resource: v1.LIBRARY_PANEL_RESOURCE}

	require.Equal(t, migrations.LibraryPanelsMigrationID, def.ID)
	require.Equal(t, migrations.LibraryPanelsMigrationLogID, def.MigrationID)
	require.ElementsMatch(t, []schema.GroupResource{libraryPanelGR}, def.GetGroupResources())
	require.Equal(t, []string{setting.LibraryPanelResource}, def.ConfigResources())
	require.NotNil(t, def.GetMigratorFunc(libraryPanelGR), "MigrateLibraryPanels must be registered")
	require.Equal(t, []string{"library_element"}, def.Resources[0].LockTables)
	require.Equal(t, dashV0.VERSION, def.Resources[0].FloorVersion)
	require.Equal(t, []string{"library_element"}, def.GetLockTables())
	require.Len(t, def.Validators, 1)
}
