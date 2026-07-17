package featuretoggleadmin

import (
	"context"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	featuretoggleapi "github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
	"github.com/grafana/grafana/pkg/services/featuretogglestore"
)

type Service struct {
	manager *featuremgmt.FeatureManager
	store   featuretogglestore.OverrideStore
	log     log.Logger
}

func ProvideService(manager *featuremgmt.FeatureManager, store featuretogglestore.OverrideStore) *Service {
	return &Service{
		manager: manager,
		store:   store,
		log:     log.New("featuretoggleadmin"),
	}
}

type UpdateFlagRequest struct {
	Name    string `json:"name"`
	Enabled bool   `json:"enabled"`
}

type ResolvedToggleStateResponse struct {
	AllowEditing    bool                            `json:"allowEditing,omitempty"`
	RestartRequired bool                            `json:"restartRequired,omitempty"`
	Enabled         map[string]bool                 `json:"enabled,omitempty"`
	Toggles         []featuretoggleapi.ToggleStatus `json:"toggles,omitempty"`
}

func (s *Service) GetResolvedStateResponse(allowEditing bool) ResolvedToggleStateResponse {
	state := s.manager.GetResolvedState(allowEditing)
	return ResolvedToggleStateResponse{
		AllowEditing:    state.AllowEditing,
		RestartRequired: state.RestartRequired,
		Enabled:         state.Enabled,
		Toggles:         state.Toggles,
	}
}

func (s *Service) UpdateFlag(ctx context.Context, req UpdateFlagRequest, userID int64, userLogin string, orgID int64) error {
	current, _ := s.manager.CurrentValue(req.Name)

	if err := s.manager.SetFlag(req.Name, req.Enabled); err != nil {
		return err
	}

	if s.store != nil {
		if err := s.store.Upsert(ctx, req.Name, req.Enabled, userID); err != nil {
			return err
		}

		if err := s.store.LogChange(ctx, featuretogglestore.ChangeLogEntry{
			FlagName:  req.Name,
			FromValue: &current,
			ToValue:   req.Enabled,
			UserID:    userID,
			UserLogin: userLogin,
			OrgID:     orgID,
		}); err != nil {
			return err
		}
	}

	s.log.Info("feature toggle changed",
		"flag", req.Name,
		"from", current,
		"to", req.Enabled,
		"userID", userID,
		"userLogin", userLogin,
		"orgID", orgID,
	)

	return nil
}

func (s *Service) ResetFlag(ctx context.Context, name string, userID int64, userLogin string, orgID int64) error {
	current, _ := s.manager.CurrentValue(name)

	if err := s.manager.RemoveOverride(name); err != nil {
		return err
	}

	if s.store != nil {
		if err := s.store.Delete(ctx, name); err != nil {
			return err
		}

		newValue := s.manager.EnabledSnapshot(name)
		if err := s.store.LogChange(ctx, featuretogglestore.ChangeLogEntry{
			FlagName:  name,
			FromValue: &current,
			ToValue:   newValue,
			UserID:    userID,
			UserLogin: userLogin,
			OrgID:     orgID,
		}); err != nil {
			return err
		}
	}

	s.log.Info("feature toggle reset",
		"flag", name,
		"from", current,
		"userID", userID,
		"userLogin", userLogin,
		"orgID", orgID,
	)

	return nil
}
