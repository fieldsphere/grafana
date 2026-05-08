package dtos

// ResolvedFeatureTogglesDTO is the admin JSON payload for the Labs feature flags view.
type ResolvedFeatureTogglesDTO struct {
	AllowEditing    bool                     `json:"allowEditing"`
	RestartRequired bool                     `json:"restartRequired"`
	Enabled         map[string]bool          `json:"enabled"`
	Toggles         []FeatureToggleStatusDTO `json:"toggles"`
}

// FeatureToggleStatusDTO describes one feature toggle for read-only admin inspection.
type FeatureToggleStatusDTO struct {
	Name            string `json:"name"`
	Description     string `json:"description,omitempty"`
	Stage           string `json:"stage"`
	Enabled         bool   `json:"enabled"`
	Writeable       bool   `json:"writeable"`
	Warning         string `json:"warning,omitempty"`
	RequiresRestart bool   `json:"requiresRestart,omitempty"`
	FrontendOnly    bool   `json:"frontend,omitempty"`
	RequiresDevMode bool   `json:"requiresDevMode,omitempty"`
	Expression      string `json:"expression,omitempty"`
}
