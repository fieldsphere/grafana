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

func TestFoldersDashboardsMigrationRegistersLibraryPanels(t *testing.T) {
	def := FoldersDashboardsMigration(dashboardmigrator.ProvideFoldersDashboardsMigrator(nil))

	folderGR := schema.GroupResource{Group: folders.GROUP, Resource: folders.RESOURCE}
	dashboardGR := schema.GroupResource{Group: v1.GROUP, Resource: v1.DASHBOARD_RESOURCE}
	libraryPanelGR := schema.GroupResource{Group: v1.GROUP, Resource: v1.LIBRARY_PANEL_RESOURCE}

	require.Equal(t, migrations.FoldersDashboardsMigrationID, def.ID)
	require.ElementsMatch(t, []schema.GroupResource{folderGR, dashboardGR, libraryPanelGR}, def.GetGroupResources())
	require.ElementsMatch(t, []string{
		setting.FolderResource,
		setting.DashboardResource,
		setting.LibraryPanelResource,
	}, def.ConfigResources())

	require.NotNil(t, def.GetMigratorFunc(libraryPanelGR), "MigrateLibraryPanels must be registered")
	require.NotNil(t, def.GetMigratorFunc(folderGR))
	require.NotNil(t, def.GetMigratorFunc(dashboardGR))

	var libraryPanelInfo *migrations.ResourceInfo
	for i := range def.Resources {
		if def.Resources[i].GroupResource == libraryPanelGR {
			libraryPanelInfo = &def.Resources[i]
			break
		}
	}
	require.NotNil(t, libraryPanelInfo)
	require.Equal(t, []string{"library_element"}, libraryPanelInfo.LockTables)
	require.Equal(t, dashV0.VERSION, libraryPanelInfo.FloorVersion)
	require.Contains(t, def.GetLockTables(), "library_element")
	require.Len(t, def.Validators, 4)
}
