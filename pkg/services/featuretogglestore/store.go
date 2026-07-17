package featuretogglestore

import (
	"context"
	"time"

	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/infra/log"
)

type FeatureToggleOverride struct {
	FlagName  string    `xorm:"flag_name pk"`
	Enabled   bool      `xorm:"enabled"`
	UpdatedBy int64     `xorm:"updated_by"`
	Updated   time.Time `xorm:"updated"`
}

type ChangeLogEntry struct {
	FlagName  string
	FromValue *bool
	ToValue   bool
	UserID    int64
	UserLogin string
	OrgID     int64
}

type featureToggleChangeLog struct {
	ID        int64     `xorm:"pk autoincr 'id'"`
	FlagName  string    `xorm:"flag_name"`
	FromValue *bool     `xorm:"from_value"`
	ToValue   bool      `xorm:"to_value"`
	UserID    int64     `xorm:"user_id"`
	UserLogin string    `xorm:"user_login"`
	OrgID     int64     `xorm:"org_id"`
	Created   time.Time `xorm:"created"`
}

type Store struct {
	sqlStore db.DB
	log      log.Logger
}

func ProvideStore(sqlStore db.DB) *Store {
	return &Store{
		sqlStore: sqlStore,
		log:      log.New("featuretogglestore"),
	}
}

func (s *Store) List(ctx context.Context) (map[string]bool, error) {
	result := make(map[string]bool)

	err := s.sqlStore.WithDbSession(ctx, func(sess *db.Session) error {
		rows := make([]FeatureToggleOverride, 0)
		if err := sess.Find(&rows); err != nil {
			return err
		}
		for _, row := range rows {
			result[row.FlagName] = row.Enabled
		}
		return nil
	})

	return result, err
}

func (s *Store) Upsert(ctx context.Context, flagName string, enabled bool, userID int64) error {
	now := time.Now()

	return s.sqlStore.WithTransactionalDbSession(ctx, func(sess *db.Session) error {
		existing := FeatureToggleOverride{FlagName: flagName}
		has, err := sess.Get(&existing)
		if err != nil {
			return err
		}

		row := FeatureToggleOverride{
			FlagName:  flagName,
			Enabled:   enabled,
			UpdatedBy: userID,
			Updated:   now,
		}

		if has {
			_, err = sess.Where("flag_name = ?", flagName).AllCols().Update(&row)
		} else {
			_, err = sess.Insert(&row)
		}
		return err
	})
}

func (s *Store) Delete(ctx context.Context, flagName string) error {
	return s.sqlStore.WithTransactionalDbSession(ctx, func(sess *db.Session) error {
		_, err := sess.Where("flag_name = ?", flagName).Delete(&FeatureToggleOverride{})
		return err
	})
}

func (s *Store) LogChange(ctx context.Context, entry ChangeLogEntry) error {
	row := featureToggleChangeLog{
		FlagName:  entry.FlagName,
		FromValue: entry.FromValue,
		ToValue:   entry.ToValue,
		UserID:    entry.UserID,
		UserLogin: entry.UserLogin,
		OrgID:     entry.OrgID,
		Created:   time.Now(),
	}

	return s.sqlStore.WithTransactionalDbSession(ctx, func(sess *db.Session) error {
		_, err := sess.Insert(&row)
		return err
	})
}

type noopStore struct{}

func ProvideNoopStore() OverrideStore {
	return noopStore{}
}

type OverrideStore interface {
	List(ctx context.Context) (map[string]bool, error)
	Upsert(ctx context.Context, flagName string, enabled bool, userID int64) error
	Delete(ctx context.Context, flagName string) error
	LogChange(ctx context.Context, entry ChangeLogEntry) error
}

var _ OverrideStore = (*Store)(nil)

func (noopStore) List(context.Context) (map[string]bool, error) {
	return map[string]bool{}, nil
}

func (noopStore) Upsert(context.Context, string, bool, int64) error { return nil }

func (noopStore) Delete(context.Context, string) error { return nil }

func (noopStore) LogChange(context.Context, ChangeLogEntry) error { return nil }
