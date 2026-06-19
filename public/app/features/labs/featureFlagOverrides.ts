import { type FeatureToggles, store } from '@grafana/data';

export const FEATURE_TOGGLE_STORAGE_KEY = 'grafana.featureToggles';

export type FeatureFlagOverrides = Record<string, boolean>;

export interface FeatureFlagRow {
  name: string;
  enabled: boolean;
  source: 'server' | 'local';
}

const featureFlagNameCollator = new Intl.Collator();

function getStoredFeatureFlagOverrides(): string {
  return String(store.get(FEATURE_TOGGLE_STORAGE_KEY) || '');
}

export function parseFeatureFlagOverrides(value = getStoredFeatureFlagOverrides()): FeatureFlagOverrides {
  return value.split(',').reduce<FeatureFlagOverrides>((acc, feature) => {
    const [name, rawValue] = feature.split('=');
    const trimmedName = name?.trim();

    if (!trimmedName || rawValue === undefined) {
      return acc;
    }

    acc[trimmedName] = rawValue === 'true' || rawValue === '1';
    return acc;
  }, {});
}

export function saveFeatureFlagOverrides(overrides: FeatureFlagOverrides) {
  const serialized = Object.entries(overrides)
    .sort(([a], [b]) => featureFlagNameCollator.compare(a, b))
    .map(([name, enabled]) => `${name}=${enabled ? 'true' : 'false'}`)
    .join(',');

  if (serialized) {
    store.set(FEATURE_TOGGLE_STORAGE_KEY, serialized);
  } else {
    store.delete(FEATURE_TOGGLE_STORAGE_KEY);
  }
}

export function getFeatureFlagRows(featureToggles: FeatureToggles, overrides: FeatureFlagOverrides): FeatureFlagRow[] {
  const names = new Set<string>();

  for (const [name, enabled] of Object.entries(featureToggles)) {
    if (enabled) {
      names.add(name);
    }
  }

  for (const name of Object.keys(overrides)) {
    names.add(name);
  }

  return Array.from(names)
    .map((name) => {
      const hasOverride = Object.prototype.hasOwnProperty.call(overrides, name);

      return {
        name,
        enabled: hasOverride ? overrides[name] : Boolean(Reflect.get(featureToggles, name)),
        source: hasOverride ? 'local' : 'server',
      } satisfies FeatureFlagRow;
    })
    .sort((a, b) => featureFlagNameCollator.compare(a.name, b.name));
}
