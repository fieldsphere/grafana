package featuretoggle

import "github.com/grafana/grafana/pkg/services/sqlstore/migrator"

func AddMigration(mg *migrator.Migrator) {
	overrideTable := migrator.Table{
		Name: "feature_toggle_override",
		Columns: []*migrator.Column{
			{Name: "flag_name", Type: migrator.DB_NVarchar, Length: 190, IsPrimaryKey: true},
			{Name: "enabled", Type: migrator.DB_Bool, Nullable: false},
			{Name: "updated_by", Type: migrator.DB_BigInt, Nullable: false},
			{Name: "updated", Type: migrator.DB_DateTime, Nullable: false},
		},
	}

	changeLogTable := migrator.Table{
		Name: "feature_toggle_change_log",
		Columns: []*migrator.Column{
			{Name: "id", Type: migrator.DB_BigInt, IsPrimaryKey: true, IsAutoIncrement: true},
			{Name: "flag_name", Type: migrator.DB_NVarchar, Length: 190, Nullable: false},
			{Name: "from_value", Type: migrator.DB_Bool, Nullable: true},
			{Name: "to_value", Type: migrator.DB_Bool, Nullable: false},
			{Name: "user_id", Type: migrator.DB_BigInt, Nullable: false},
			{Name: "user_login", Type: migrator.DB_NVarchar, Length: 190, Nullable: false},
			{Name: "org_id", Type: migrator.DB_BigInt, Nullable: false},
			{Name: "created", Type: migrator.DB_DateTime, Nullable: false},
		},
		Indices: []*migrator.Index{
			{Cols: []string{"flag_name"}, Type: migrator.IndexType},
			{Cols: []string{"created"}, Type: migrator.IndexType},
		},
	}

	mg.AddMigration("create feature_toggle_override table", migrator.NewAddTableMigration(overrideTable))
	mg.AddMigration("create feature_toggle_change_log table", migrator.NewAddTableMigration(changeLogTable))
}
