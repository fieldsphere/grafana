import { store } from '@grafana/data';

const FEATURE_TOGGLE_STORAGE_KEY = 'grafana.featureToggles';
const compare = new Intl.Collator('en', { sensitivity: 'base', numeric: true }).compare;

export type FeatureToggleOverrides = Record<string, boolean>;

export function getFeatureToggleOverrides(): FeatureToggleOverrides {
  const rawValue = store.get(FEATURE_TOGGLE_STORAGE_KEY);
  const raw = typeof rawValue === 'string' ? rawValue : '';
  const overrides: FeatureToggleOverrides = {};

  for (const entry of raw.split(',')) {
    const [key, value] = entry.split('=');
    const trimmedKey = key?.trim();

    if (!trimmedKey) {
      continue;
    }

    overrides[trimmedKey] = value === 'true' || value === '1';
  }

  return overrides;
}

export function setFeatureToggleOverride(key: string, enabled: boolean): FeatureToggleOverrides {
  const overrides = {
    ...getFeatureToggleOverrides(),
    [key]: enabled,
  };

  writeFeatureToggleOverrides(overrides);
  return overrides;
}

export function removeFeatureToggleOverride(key: string): FeatureToggleOverrides {
  const overrides = getFeatureToggleOverrides();
  delete overrides[key];
  writeFeatureToggleOverrides(overrides);
  return overrides;
}

function writeFeatureToggleOverrides(overrides: FeatureToggleOverrides) {
  const entries = Object.entries(overrides).sort(([a], [b]) => compare(a, b));

  if (entries.length === 0) {
    store.delete(FEATURE_TOGGLE_STORAGE_KEY);
    return;
  }

  store.set(FEATURE_TOGGLE_STORAGE_KEY, entries.map(([key, enabled]) => `${key}=${enabled ? '1' : '0'}`).join(','));
}
