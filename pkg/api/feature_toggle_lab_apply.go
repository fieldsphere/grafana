package api

import (
	"context"
	"errors"
	"fmt"

	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/featuremgmt/labdb"
)

func upsertLabsFeatureToggle(ctx context.Context, sqlStore db.DB, fm *featuremgmt.FeatureManager, flagName string, enabled bool) error {
	if sqlStore == nil {
		return errors.New("database unavailable")
	}
	def, ok := featureDefinitionByName(fm, flagName)
	if !ok {
		return fmt.Errorf("unknown feature toggle: %s", flagName)
	}
	if !isLabsWritableFlag(def) {
		return fmt.Errorf("feature toggle %s cannot be changed from Labs", flagName)
	}
	if err := labdb.Upsert(ctx, sqlStore, flagName, enabled); err != nil {
		return err
	}
	reloadLabsOverrides(ctx, sqlStore, fm)
	return nil
}

func deleteLabsFeatureToggle(ctx context.Context, sqlStore db.DB, fm *featuremgmt.FeatureManager, flagName string) error {
	if sqlStore == nil {
		return errors.New("database unavailable")
	}
	if _, ok := featureDefinitionByName(fm, flagName); !ok {
		return fmt.Errorf("unknown feature toggle: %s", flagName)
	}
	if err := labdb.Delete(ctx, sqlStore, flagName); err != nil {
		return err
	}
	reloadLabsOverrides(ctx, sqlStore, fm)
	return nil
}

func reloadLabsOverrides(ctx context.Context, sqlStore db.DB, fm *featuremgmt.FeatureManager) {
	merged, err := labdb.LoadOverrides(ctx, sqlStore)
	if err != nil {
		return
	}
	if len(merged) == 0 {
		fm.SetLabOverrides(nil)
	} else {
		fm.SetLabOverrides(merged)
	}
}

func featureDefinitionByName(fm *featuremgmt.FeatureManager, name string) (featuremgmt.FeatureFlag, bool) {
	for _, f := range fm.GetFlags() {
		if f.Name == name {
			return f, true
		}
	}
	return featuremgmt.FeatureFlag{}, false
}
