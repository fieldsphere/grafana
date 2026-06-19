import { type FeatureToggles, store } from '@grafana/data';

import {
  FEATURE_TOGGLE_STORAGE_KEY,
  getFeatureFlagRows,
  parseFeatureFlagOverrides,
  saveFeatureFlagOverrides,
} from './featureFlagOverrides';

describe('feature flag overrides', () => {
  afterEach(() => {
    store.delete(FEATURE_TOGGLE_STORAGE_KEY);
  });

  it('parses Grafana feature toggle override storage values', () => {
    expect(parseFeatureFlagOverrides('alpha=1,beta=false,gamma=true,ignored')).toEqual({
      alpha: true,
      beta: false,
      gamma: true,
    });
  });

  it('serializes local overrides in a stable order', () => {
    saveFeatureFlagOverrides({ zeta: false, alpha: true });

    expect(store.get(FEATURE_TOGGLE_STORAGE_KEY)).toBe('alpha=true,zeta=false');
  });

  it('builds rows from enabled flags and local overrides', () => {
    expect(
      getFeatureFlagRows({ enabledByServer: true, disabledByServer: false } as FeatureToggles, {
        disabledLocally: false,
        enabledLocally: true,
      })
    ).toEqual([
      { name: 'disabledLocally', enabled: false, source: 'local' },
      { name: 'enabledByServer', enabled: true, source: 'server' },
      { name: 'enabledLocally', enabled: true, source: 'local' },
    ]);
  });

  it('removes the storage key when overrides are cleared', () => {
    saveFeatureFlagOverrides({ alpha: true });
    saveFeatureFlagOverrides({});

    expect(store.get(FEATURE_TOGGLE_STORAGE_KEY)).toBeUndefined();
  });
});
