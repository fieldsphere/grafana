package featuremgmt

import "errors"

var (
	ErrUnknownFeatureFlag      = errors.New("unknown feature flag")
	ErrFeatureFlagNotWriteable = errors.New("feature flag is not writeable")
	ErrFeatureFlagReadOnly     = errors.New("feature flag is configured in grafana.ini and cannot be changed")
)
