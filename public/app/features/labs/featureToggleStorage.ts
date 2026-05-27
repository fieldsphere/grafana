const LOCAL_STORAGE_KEY = 'grafana.featureToggles';

export function getLocalFeatureToggleOverrides(): Record<string, boolean> {
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  const overrides: Record<string, boolean> = {};
  for (const entry of raw.split(',')) {
    const [name, value] = entry.split('=');
    if (!name) {
      continue;
    }
    overrides[name] = value === 'true' || value === '1';
  }
  return overrides;
}

export function setLocalFeatureToggle(name: string, enabled: boolean): void {
  const overrides = getLocalFeatureToggleOverrides();
  overrides[name] = enabled;

  const serialized = Object.entries(overrides)
    .map(([flagName, flagEnabled]) => `${flagName}=${flagEnabled ? '1' : '0'}`)
    .join(',');

  window.localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
}

export function isBrowserToggleable(flag: {
  frontendOnly?: boolean;
  requiresRestart?: boolean;
  requiresDevMode?: boolean;
}): boolean {
  return Boolean(flag.frontendOnly && !flag.requiresRestart && !flag.requiresDevMode);
}
