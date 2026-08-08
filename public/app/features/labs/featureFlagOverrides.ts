import { store } from '@grafana/data';

export const FEATURE_TOGGLES_STORAGE_KEY = 'grafana.featureToggles';

export type FeatureToggleOverrides = Record<string, boolean>;

export interface FeatureToggleRow {
  name: string;
  enabled: boolean;
  hasOverride: boolean;
}

const compareFeatureNames = new Intl.Collator('en', { sensitivity: 'base', numeric: true }).compare;

export function parseFeatureToggleOverrides(rawValue: unknown): FeatureToggleOverrides {
  if (typeof rawValue !== 'string' || rawValue.trim() === '') {
    return {};
  }

  return rawValue.split(',').reduce<FeatureToggleOverrides>((overrides, feature) => {
    const [rawName, rawFeatureValue = ''] = feature.split('=');
    const name = rawName.trim();

    if (name) {
      const featureValue = rawFeatureValue.trim();
      overrides[name] = featureValue === 'true' || featureValue === '1';
    }

    return overrides;
  }, {});
}

export function formatFeatureToggleOverrides(overrides: FeatureToggleOverrides): string {
  return Object.entries(overrides)
    .filter(([name]) => name.trim() !== '')
    .sort(([a], [b]) => compareFeatureNames(a, b))
    .map(([name, enabled]) => `${name}=${enabled ? '1' : '0'}`)
    .join(',');
}

export function getStoredFeatureToggleOverrides(): FeatureToggleOverrides {
  const rawValue = store.get(FEATURE_TOGGLES_STORAGE_KEY);
  return parseFeatureToggleOverrides(rawValue == null ? '' : String(rawValue));
}

export function setStoredFeatureToggleOverrides(overrides: FeatureToggleOverrides) {
  store.set(FEATURE_TOGGLES_STORAGE_KEY, formatFeatureToggleOverrides(overrides));
}

export function getFeatureToggleRows(featureToggles: object, overrides: FeatureToggleOverrides): FeatureToggleRow[] {
  const names = new Set<string>();

  for (const [name, enabled] of Object.entries(featureToggles)) {
    if (enabled) {
      names.add(name);
    }
  }

  for (const name of Object.keys(overrides)) {
    names.add(name);
  }

  return [...names].sort(compareFeatureNames).map((name) => ({
    name,
    enabled: overrides[name] ?? isFeatureEnabled(featureToggles, name),
    hasOverride: Object.prototype.hasOwnProperty.call(overrides, name),
  }));
}

function isFeatureEnabled(featureToggles: object, name: string): boolean {
  return Object.entries(featureToggles).some(([featureName, enabled]) => featureName === name && enabled === true);
}
