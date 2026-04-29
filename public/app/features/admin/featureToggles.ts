import { type FeatureToggles, featureToggleKeys } from '@grafana/data';
import { config } from '@grafana/runtime';

export const FEATURE_TOGGLE_LOCAL_STORAGE_KEY = 'grafana.featureToggles';

export type FeatureToggleName = keyof FeatureToggles | string;
export type OverrideMap = Partial<Record<FeatureToggleName, boolean>>;

export interface FeatureToggleRow {
  name: FeatureToggleName;
  enabled: boolean;
  hasOverride: boolean;
  overrideValue?: boolean;
}

export function parseFeatureToggleOverrides(value: string | null): OverrideMap {
  if (!value) {
    return {};
  }

  return value.split(',').reduce<OverrideMap>((overrides, feature) => {
    const [featureName, featureValue] = feature.split('=');

    if (!featureName) {
      return overrides;
    }

    overrides[featureName] = featureValue === 'true' || featureValue === '1';
    return overrides;
  }, {});
}

export function serializeFeatureToggleOverrides(overrides: OverrideMap): string {
  return Object.entries(overrides)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([featureName, enabled]) => `${featureName}=${enabled}`)
    .join(',');
}

export function readFeatureToggleOverrides(): OverrideMap {
  return parseFeatureToggleOverrides(window.localStorage.getItem(FEATURE_TOGGLE_LOCAL_STORAGE_KEY));
}

export function writeFeatureToggleOverrides(overrides: OverrideMap) {
  const serializedOverrides = serializeFeatureToggleOverrides(overrides);

  if (serializedOverrides) {
    window.localStorage.setItem(FEATURE_TOGGLE_LOCAL_STORAGE_KEY, serializedOverrides);
  } else {
    window.localStorage.removeItem(FEATURE_TOGGLE_LOCAL_STORAGE_KEY);
  }
}

export function applyFeatureToggleOverride(featureName: string, enabled: boolean) {
  const featureToggles = config.featureToggles as Record<string, boolean>;
  featureToggles[featureName] = enabled;
  config.bootData.settings.featureToggles = featureToggles as FeatureToggles;
}

export function getFeatureToggleRows(featureToggles: FeatureToggles, overrides: OverrideMap): FeatureToggleRow[] {
  const names = new Set<FeatureToggleName>([
    ...featureToggleKeys,
    ...(Object.keys(featureToggles) as FeatureToggleName[]),
    ...(Object.keys(overrides) as FeatureToggleName[]),
  ]);

  return Array.from(names)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      enabled: Boolean(featureToggles[name as keyof FeatureToggles]),
      hasOverride: Object.prototype.hasOwnProperty.call(overrides, name),
      overrideValue: overrides[name],
    }));
}
