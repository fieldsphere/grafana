import { type FeatureToggles, store } from '@grafana/data';

import { FEATURE_TOGGLE_STORAGE_KEY } from './constants';

export type FeatureToggleOverrides = Record<string, boolean>;

interface FeatureToggleStore {
  get: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
}

export interface FeatureToggleRow {
  name: string;
  enabled: boolean;
  isOverridden: boolean;
}

const featureToggleNameCollator = new Intl.Collator();

export function parseFeatureToggleOverrides(value: string | null): FeatureToggleOverrides {
  if (!value) {
    return {};
  }

  return value.split(',').reduce<FeatureToggleOverrides>((acc, feature) => {
    const [rawName, rawValue] = feature.split('=');
    const name = rawName?.trim();

    if (name) {
      acc[name] = rawValue === 'true' || rawValue === '1';
    }

    return acc;
  }, {});
}

export function serializeFeatureToggleOverrides(overrides: FeatureToggleOverrides): string {
  return Object.entries(overrides)
    .sort(([a], [b]) => featureToggleNameCollator.compare(a, b))
    .map(([name, enabled]) => `${name}=${enabled ? '1' : '0'}`)
    .join(',');
}

export function readFeatureToggleOverrides(storage: FeatureToggleStore = store): FeatureToggleOverrides {
  return parseFeatureToggleOverrides(storage.get(FEATURE_TOGGLE_STORAGE_KEY) ?? null);
}

export function writeFeatureToggleOverrides(overrides: FeatureToggleOverrides, storage: FeatureToggleStore = store) {
  const serialized = serializeFeatureToggleOverrides(overrides);

  if (serialized) {
    storage.set(FEATURE_TOGGLE_STORAGE_KEY, serialized);
  } else {
    storage.delete(FEATURE_TOGGLE_STORAGE_KEY);
  }
}

export function getFeatureToggleRows(
  featureToggles: FeatureToggles,
  overrides: FeatureToggleOverrides
): FeatureToggleRow[] {
  const enabledFeatureToggles = new Set(
    Object.entries(featureToggles)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name)
  );
  const names = new Set([...enabledFeatureToggles, ...Object.keys(overrides)]);

  return Array.from(names)
    .sort(featureToggleNameCollator.compare)
    .map((name) => ({
      name,
      enabled: enabledFeatureToggles.has(name),
      isOverridden: Object.prototype.hasOwnProperty.call(overrides, name),
    }));
}
