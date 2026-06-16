package featuretoggleadmin

import (
	"context"

	"github.com/grafana/grafana/pkg/infra/log"
	featuretoggleapi "github.com/grafana/grafana/pkg/services/featuremgmt/feature_toggle_api"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/featuremgmt/persist"
)

// Service exposes server-persisted feature toggle management.
type Service struct {
	manager *featuremgmt.FeatureManager
	store   persist.Store
	log     log.Logger
}

func ProvideService(manager *featuremgmt.FeatureManager, store persist.Store) (*Service, error) {
	service := &Service{
		manager: manager,
		store:   store,
		log:     log.New("featuretoggleadmin"),
	}
	if err := service.loadOverrides(context.Background()); err != nil {
		return nil, err
	}
	return service, nil
}

func (s *Service) loadOverrides(ctx context.Context) error {
	overrides, err := s.store.GetAll(ctx)
	if err != nil {
		return err
	}
	s.manager.LoadPersistedOverrides(overrides)
	return nil
}

func (s *Service) GetResolvedState(_ context.Context, allowEditing bool) *featuretoggleapi.ResolvedToggleState {
	return s.manager.ResolvedToggleState(allowEditing)
}

func (s *Service) SetOverride(ctx context.Context, name string, enabled bool, actor string) error {
	applyImmediately := !s.manager.FlagRequiresRestart(name)
	previous, err := s.manager.SetOverrideRuntimeState(name, enabled, applyImmediately)
	if err != nil {
		return err
	}

	if err := s.store.Set(ctx, name, enabled); err != nil {
		s.manager.RevertOverrideRuntimeState(name)
		return err
	}

	if applyImmediately {
		s.log.Info("Feature toggle override applied",
			"flag", name, "enabled", enabled, "actor", actor, "previous", previous)
		return nil
	}

	s.log.Info("Feature toggle override saved, restart required",
		"flag", name, "enabled", enabled, "actor", actor, "previous", previous)
	return nil
}

func (s *Service) DeleteOverride(ctx context.Context, name string, actor string) error {
	applyImmediately := !s.manager.FlagRequiresRestart(name)
	previous, err := s.manager.ClearOverrideRuntimeState(name, applyImmediately)
	if err != nil {
		return err
	}

	if err := s.store.Delete(ctx, name); err != nil {
		return err
	}

	if applyImmediately {
		s.log.Info("Feature toggle override removed",
			"flag", name, "actor", actor, "previous", previous)
		return nil
	}

	s.log.Info("Feature toggle override removed, restart required",
		"flag", name, "actor", actor, "previous", previous)
	return nil
}
