package dtos

// FeatureFlagCatalogDTO is the response for the Labs / feature flag catalog API.
type FeatureFlagCatalogDTO struct {
	Flags []FeatureFlagCatalogEntry `json:"flags"`
}

// FeatureFlagCatalogEntry describes a single registered feature flag and its current state.
type FeatureFlagCatalogEntry struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Stage       string `json:"stage,omitempty"`
	Enabled     bool   `json:"enabled"`
}
