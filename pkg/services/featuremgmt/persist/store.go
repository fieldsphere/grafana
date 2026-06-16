package persist

import (
	"context"
	"strconv"

	"github.com/grafana/grafana/pkg/infra/kvstore"
)

const featureToggleOverridesNamespace = "featuremgmt.overrides"

type Store interface {
	GetAll(ctx context.Context) (map[string]bool, error)
	Set(ctx context.Context, name string, enabled bool) error
	Delete(ctx context.Context, name string) error
}

type store struct {
	kv *kvstore.NamespacedKVStore
}

func ProvideStore(kv kvstore.KVStore) Store {
	return &store{kv: kvstore.WithNamespace(kv, 0, featureToggleOverridesNamespace)}
}

func (s *store) GetAll(ctx context.Context) (map[string]bool, error) {
	all, err := s.kv.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	orgOverrides, ok := all[0]
	if !ok {
		return map[string]bool{}, nil
	}

	out := make(map[string]bool, len(orgOverrides))
	for key, value := range orgOverrides {
		enabled, err := strconv.ParseBool(value)
		if err != nil {
			continue
		}
		out[key] = enabled
	}
	return out, nil
}

func (s *store) Set(ctx context.Context, name string, enabled bool) error {
	return s.kv.Set(ctx, name, strconv.FormatBool(enabled))
}

func (s *store) Delete(ctx context.Context, name string) error {
	return s.kv.Del(ctx, name)
}
