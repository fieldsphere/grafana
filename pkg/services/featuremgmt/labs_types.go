package featuremgmt

// LabsOverrides is persisted instance-wide feature toggle overrides from the Labs UI.
type LabsOverrides map[string]bool

// LabsFlagDetail is returned by the Labs admin API for each registered feature flag.
type LabsFlagDetail struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	FrontendOnly    bool   `json:"frontendOnly"`
	RequiresRestart bool   `json:"requiresRestart"`
	RequiresDevMode bool   `json:"requiresDevMode"`
	Enabled         bool   `json:"enabled"`
	Source          string `json:"source"` // default | config | labs
	Writable        bool   `json:"writable"`
	MeetsRuntime    bool   `json:"meetsRuntime"`
	BlockedReason   string `json:"blockedReason,omitempty"`
}
