package featuremgmt

import "errors"

var (
	ErrUnknownFeatureFlag = errors.New("unknown feature flag")
	ErrFeatureFlagLocked  = errors.New("feature flag is locked by configuration")
	ErrFeatureFlagRestricted = errors.New("feature flag cannot be enabled in this environment")
)
