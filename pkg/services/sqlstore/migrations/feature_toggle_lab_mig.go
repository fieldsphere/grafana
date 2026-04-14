package migrations

import (
	. "github.com/grafana/grafana/pkg/services/sqlstore/migrator"
)

func addFeatureToggleLabOverridesMigration(mg *Migrator) {
	table := Table{
		Name: "feature_toggle_lab_override",
		Columns: []*Column{
			{Name: "id", Type: DB_BigInt, Nullable: false, IsPrimaryKey: true, IsAutoIncrement: true},
			{Name: "flag_name", Type: DB_NVarchar, Length: 190, Nullable: false},
			{Name: "enabled", Type: DB_Bool, Nullable: false},
			{Name: "created", Type: DB_DateTime, Nullable: false},
			{Name: "updated", Type: DB_DateTime, Nullable: false},
		},
		Indices: []*Index{
			{Cols: []string{"flag_name"}, Type: UniqueIndex},
		},
	}

	mg.AddMigration("create feature_toggle_lab_override table", NewAddTableMigration(table))
}
