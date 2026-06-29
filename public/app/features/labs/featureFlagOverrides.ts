export const FEATURE_TOGGLES_LOCAL_STORAGE_KEY = 'grafana.featureToggles';

export interface FeatureFlagEntry {
  name: string;
  bootValue: boolean;
  effectiveValue: boolean;
  hasOverride: boolean;
}

export function parseFeatureToggleOverrides(value: string | null): Record<string, boolean> {
  if (!value) {
    return {};
  }

  const overrides: Record<string, boolean> = {};

  for (const feature of value.split(',')) {
    const [featureName, featureValue] = feature.split('=');
    if (!featureName) {
      continue;
    }

    overrides[featureName] = featureValue === 'true' || featureValue === '1';
  }

  return overrides;
}

export function serializeFeatureToggleOverrides(overrides: Record<string, boolean>): string {
  return Object.entries(overrides)
    .map(([name, value]) => `${name}=${value ? '1' : '0'}`)
    .join(',');
}

export function readFeatureToggleOverridesFromLocalStorage(
  storage: Pick<Storage, 'getItem'> = window.localStorage
): Record<string, boolean> {
  return parseFeatureToggleOverrides(storage.getItem(FEATURE_TOGGLES_LOCAL_STORAGE_KEY));
}

export function writeFeatureToggleOverridesToLocalStorage(
  overrides: Record<string, boolean>,
  storage: Pick<Storage, 'setItem' | 'removeItem'> = window.localStorage
): void {
  const serialized = serializeFeatureToggleOverrides(overrides);

  if (serialized) {
    storage.setItem(FEATURE_TOGGLES_LOCAL_STORAGE_KEY, serialized);
    return;
  }

  storage.removeItem(FEATURE_TOGGLES_LOCAL_STORAGE_KEY);
}

export function getFeatureFlagEntries(
  featureToggles: Record<string, boolean>,
  overrides: Record<string, boolean>
): FeatureFlagEntry[] {
  const names = new Set([...Object.keys(featureToggles), ...Object.keys(overrides)]);

  return Array.from(names)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => {
      const hasOverride = Object.hasOwn(overrides, name);
      const bootValue = featureToggles[name] ?? false;

      return {
        name,
        bootValue,
        effectiveValue: hasOverride ? overrides[name] : bootValue,
        hasOverride,
      };
    });
}

export function setFeatureToggleOverride(
  overrides: Record<string, boolean>,
  name: string,
  value: boolean
): Record<string, boolean> {
  return {
    ...overrides,
    [name]: value,
  };
}

export function removeFeatureToggleOverride(
  overrides: Record<string, boolean>,
  name: string
): Record<string, boolean> {
  const nextOverrides = { ...overrides };
  delete nextOverrides[name];
  return nextOverrides;
}
