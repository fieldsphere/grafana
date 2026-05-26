import { config, getBackendSrv } from '@grafana/runtime';

export const FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY = 'grafana.featureToggles';

export type FeatureToggleOverrideMap = Record<string, boolean>;
export type FeatureToggleValue = boolean | number | string | Record<string, unknown> | unknown[] | null | undefined;

type OFREPFlag = {
  key: string;
  value: FeatureToggleValue;
};

type OFREPBulkEvaluateResponse = {
  flags?: OFREPFlag[];
};

export function parseFeatureToggleOverrides(value: string | null | undefined): FeatureToggleOverrideMap {
  if (!value) {
    return {};
  }

  return value.split(',').reduce<FeatureToggleOverrideMap>((acc, pair) => {
    const [rawName, rawValue] = pair.split('=');
    const name = rawName?.trim();
    const parsedValue = parseBooleanOverride(rawValue);

    if (!name || parsedValue === undefined) {
      return acc;
    }

    acc[name] = parsedValue;
    return acc;
  }, {});
}

export function serializeFeatureToggleOverrides(overrides: FeatureToggleOverrideMap): string {
  return Object.entries(overrides)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, enabled]) => `${name}=${enabled ? 'true' : 'false'}`)
    .join(',');
}

export function readFeatureToggleOverrides(): FeatureToggleOverrideMap {
  return parseFeatureToggleOverrides(window.localStorage.getItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY));
}

export function writeFeatureToggleOverrides(overrides: FeatureToggleOverrideMap): void {
  persistFeatureToggleOverrides(overrides);
  applyOverridesToRuntime(overrides);
}

function persistFeatureToggleOverrides(overrides: FeatureToggleOverrideMap): void {
  const serialized = serializeFeatureToggleOverrides(overrides);

  if (serialized) {
    window.localStorage.setItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY, serialized);
  } else {
    window.localStorage.removeItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY);
  }
}

export function setFeatureToggleOverride(name: string, enabled: boolean): FeatureToggleOverrideMap {
  const overrides = readFeatureToggleOverrides();
  overrides[name] = enabled;
  writeFeatureToggleOverrides(overrides);
  return overrides;
}

export function clearFeatureToggleOverride(name: string, fallbackValue?: FeatureToggleValue): FeatureToggleOverrideMap {
  const overrides = readFeatureToggleOverrides();
  delete overrides[name];
  persistFeatureToggleOverrides(overrides);
  restoreRuntimeFeatureToggle(name, fallbackValue);
  applyOverridesToRuntime(overrides);
  return overrides;
}

export function clearAllFeatureToggleOverrides(
  fallbackValues: Record<string, FeatureToggleValue> = {}
): FeatureToggleOverrideMap {
  const overrides = readFeatureToggleOverrides();
  const fallbacksForClearedOverrides: Record<string, FeatureToggleValue> = {};

  for (const name of Object.keys(overrides)) {
    fallbacksForClearedOverrides[name] = fallbackValues[name];
  }

  window.localStorage.removeItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY);
  restoreRuntimeFeatureToggles(fallbacksForClearedOverrides);
  return {};
}

export function getEffectiveFeatureToggleValue(
  name: string,
  serverValue: FeatureToggleValue,
  defaultValue: FeatureToggleValue,
  overrides: FeatureToggleOverrideMap
): FeatureToggleValue {
  if (Object.prototype.hasOwnProperty.call(overrides, name)) {
    return overrides[name];
  }

  return serverValue ?? defaultValue;
}

export async function fetchServerFeatureToggleValues(): Promise<Record<string, FeatureToggleValue>> {
  const namespace = config.namespace || 'default';
  const response = await getBackendSrv().post<OFREPBulkEvaluateResponse>(
    `/apis/features.grafana.app/v0alpha1/namespaces/${namespace}/ofrep/v1/evaluate/flags`,
    {
      context: {
        targetingKey: namespace,
        namespace,
        ...config.openFeatureContext,
      },
    }
  );

  return (response.flags ?? []).reduce<Record<string, FeatureToggleValue>>((acc, flag) => {
    acc[flag.key] = flag.value;
    return acc;
  }, {});
}

function parseBooleanOverride(value: string | undefined): boolean | undefined {
  const normalized = value?.trim().toLowerCase();

  if (normalized === 'true' || normalized === '1') {
    return true;
  }

  if (normalized === 'false' || normalized === '0') {
    return false;
  }

  return undefined;
}

function applyOverridesToRuntime(overrides: FeatureToggleOverrideMap): void {
  const runtimeToggles = config.featureToggles as Record<string, boolean>;

  for (const [name, enabled] of Object.entries(overrides)) {
    runtimeToggles[name] = enabled;
  }
}

function restoreRuntimeFeatureToggle(name: string, fallbackValue?: FeatureToggleValue): void {
  const runtimeToggles = config.featureToggles as Record<string, boolean>;

  if (typeof fallbackValue === 'boolean') {
    runtimeToggles[name] = fallbackValue;
    return;
  }

  delete runtimeToggles[name];
}

function restoreRuntimeFeatureToggles(fallbackValues: Record<string, FeatureToggleValue>): void {
  for (const [name, value] of Object.entries(fallbackValues)) {
    restoreRuntimeFeatureToggle(name, value);
  }
}
