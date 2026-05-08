import { type FeatureToggles } from '@grafana/data';

import { FEATURE_TOGGLE_STORAGE_KEY } from './constants';

export type FeatureToggleOverrides = Record<string, boolean>;

export interface FeatureToggleRow {
  name: string;
  enabled: boolean;
  isOverridden: boolean;
}

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
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, enabled]) => `${name}=${enabled ? '1' : '0'}`)
    .join(',');
}

export function readFeatureToggleOverrides(storage: Storage = window.localStorage): FeatureToggleOverrides {
  return parseFeatureToggleOverrides(storage.getItem(FEATURE_TOGGLE_STORAGE_KEY));
}

export function writeFeatureToggleOverrides(overrides: FeatureToggleOverrides, storage: Storage = window.localStorage) {
  const serialized = serializeFeatureToggleOverrides(overrides);

  if (serialized) {
    storage.setItem(FEATURE_TOGGLE_STORAGE_KEY, serialized);
  } else {
    storage.removeItem(FEATURE_TOGGLE_STORAGE_KEY);
  }
}

export function getFeatureToggleRows(
  featureToggles: FeatureToggles,
  overrides: FeatureToggleOverrides
): FeatureToggleRow[] {
  const featureToggleMap = featureToggles as Record<string, boolean | undefined>;
  const names = new Set([
    ...Object.keys(featureToggleMap).filter((name) => featureToggleMap[name]),
    ...Object.keys(overrides),
  ]);

  return Array.from(names)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      enabled: Boolean(featureToggleMap[name]),
      isOverridden: Object.prototype.hasOwnProperty.call(overrides, name),
    }));
}
