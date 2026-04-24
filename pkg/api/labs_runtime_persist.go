package api

import (
	"context"
	"encoding/json"

	"github.com/grafana/grafana/pkg/infra/kvstore"
)

const (
	runtimeTogglesKVV1Namespace = "feature_toggles"
	runtimeTogglesKVV1Key       = "runtime_toggles"
)

// loadLabsRuntimeTogglesFromKV applies persisted instance-wide feature toggle overrides to the in-memory feature manager.
func (hs *HTTPServer) loadLabsRuntimeTogglesFromKV(ctx context.Context) error {
	if hs.featureManager == nil || hs.kvStore == nil {
		return nil
	}
	ns := kvstore.WithNamespace(hs.kvStore, kvstore.AllOrganizations, runtimeTogglesKVV1Namespace)
	s, ok, err := ns.Get(ctx, runtimeTogglesKVV1Key)
	if err != nil {
		return err
	}
	if !ok {
		return nil
	}
	var m map[string]bool
	if err := json.Unmarshal([]byte(s), &m); err != nil {
		return err
	}
	hs.featureManager.ReplaceRuntimeToggles(m)
	return nil
}

// persistLabsRuntimeTogglesToKV serializes the current in-memory override map. Empty map deletes the key.
func (hs *HTTPServer) persistLabsRuntimeTogglesToKV(ctx context.Context) error {
	if hs.kvStore == nil || hs.featureManager == nil {
		return nil
	}
	m := hs.featureManager.SnapshotRuntimeToggles()
	ns := kvstore.WithNamespace(hs.kvStore, kvstore.AllOrganizations, runtimeTogglesKVV1Namespace)
	if len(m) == 0 {
		return ns.Del(ctx, runtimeTogglesKVV1Key)
	}
	b, err := json.Marshal(m)
	if err != nil {
		return err
	}
	return ns.Set(ctx, runtimeTogglesKVV1Key, string(b))
}
