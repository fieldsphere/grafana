package featuremgmt

import "context"

type overrideLoader interface {
	List(context.Context) (map[string]bool, error)
}

func InitializeFeatureOverrides(mgr *FeatureManager, store overrideLoader) (*FeatureManager, error) {
	if store == nil {
		return mgr, nil
	}

	overrides, err := store.List(context.Background())
	if err != nil {
		return mgr, err
	}

	mgr.applyOverrides(overrides)
	mgr.update()
	return mgr, nil
}
