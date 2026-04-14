package labdb

import (
	"context"
	"time"

	"github.com/grafana/grafana/pkg/infra/db"
)

const TableName = "feature_toggle_lab_override"

type row struct {
	ID       int64     `xorm:"pk autoincr 'id'"`
	FlagName string    `xorm:"flag_name"`
	Enabled  bool      `xorm:"enabled"`
	Created  time.Time `xorm:"created"`
	Updated  time.Time `xorm:"updated"`
}

func (row) TableName() string {
	return TableName
}

func LoadOverrides(ctx context.Context, sqlStore db.DB) (map[string]bool, error) {
	out := make(map[string]bool)
	err := sqlStore.WithDbSession(ctx, func(sess *db.Session) error {
		var rows []row
		if err := sess.Find(&rows); err != nil {
			return err
		}
		for _, r := range rows {
			out[r.FlagName] = r.Enabled
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return out, nil
}

func Upsert(ctx context.Context, sqlStore db.DB, flagName string, enabled bool) error {
	now := time.Now()
	return sqlStore.WithDbSession(ctx, func(sess *db.Session) error {
		var existing row
		found, err := sess.Where("flag_name = ?", flagName).Get(&existing)
		if err != nil {
			return err
		}
		if found {
			existing.Enabled = enabled
			existing.Updated = now
			_, err = sess.ID(existing.ID).Update(&existing)
			return err
		}
		r := row{
			FlagName: flagName,
			Enabled:  enabled,
			Created:  now,
			Updated:  now,
		}
		_, err = sess.Insert(&r)
		return err
	})
}

func Delete(ctx context.Context, sqlStore db.DB, flagName string) error {
	return sqlStore.WithDbSession(ctx, func(sess *db.Session) error {
		_, err := sess.Exec("DELETE FROM "+TableName+" WHERE flag_name = ?", flagName)
		return err
	})
}
