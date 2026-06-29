import { store } from '@grafana/data';

export const FEATURE_TOGGLE_STORAGE_KEY = 'grafana.featureToggles';

export type FeatureToggleOverrides = Record<string, boolean>;

const featureToggleNameCollator = new Intl.Collator(undefined, { sensitivity: 'base' });

export function parseFeatureToggleOverrides(value: string | undefined): FeatureToggleOverrides {
  const overrides: FeatureToggleOverrides = {};

  if (!value) {
    return overrides;
  }

  for (const entry of value.split(',')) {
    const [name, rawValue] = entry.split('=');
    const trimmedName = name?.trim();

    if (!trimmedName || rawValue === undefined) {
      continue;
    }

    overrides[trimmedName] = rawValue === '1' || rawValue === 'true';
  }

  return overrides;
}

export function serializeFeatureToggleOverrides(overrides: FeatureToggleOverrides): string {
  return Object.entries(overrides)
    .sort(([first], [second]) => featureToggleNameCollator.compare(first, second))
    .map(([name, enabled]) => `${name}=${enabled ? '1' : '0'}`)
    .join(',');
}

export function getFeatureToggleOverrides(): FeatureToggleOverrides {
  const storedValue = store.get(FEATURE_TOGGLE_STORAGE_KEY);

  return parseFeatureToggleOverrides(typeof storedValue === 'string' ? storedValue : String(storedValue ?? ''));
}

export function saveFeatureToggleOverrides(overrides: FeatureToggleOverrides) {
  const serialized = serializeFeatureToggleOverrides(overrides);

  if (serialized) {
    store.set(FEATURE_TOGGLE_STORAGE_KEY, serialized);
  } else {
    store.delete(FEATURE_TOGGLE_STORAGE_KEY);
  }
}

export function setFeatureToggleOverride(name: string, enabled: boolean) {
  saveFeatureToggleOverrides({
    ...getFeatureToggleOverrides(),
    [name]: enabled,
  });
}

export function removeFeatureToggleOverride(name: string) {
  const remainingOverrides = getFeatureToggleOverrides();
  delete remainingOverrides[name];

  saveFeatureToggleOverrides(remainingOverrides);
}
