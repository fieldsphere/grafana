package api

import (
	"context"

	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/featuremgmt/labdb"
)

func loadLabsOverridesIntoFeatureManager(fm *featuremgmt.FeatureManager, sqlStore db.DB) {
	if fm == nil || sqlStore == nil {
		return
	}
	overrides, err := labdb.LoadOverrides(context.Background(), sqlStore)
	if err != nil {
		fm.WarnLabsOverrideLoad(err)
		return
	}
	if len(overrides) > 0 {
		fm.SetLabOverrides(overrides)
	}
}
