import { type BackendSrv, config, getBackendSrv, setBackendSrv } from '@grafana/runtime';

import {
  clearAllFeatureToggleOverrides,
  clearFeatureToggleOverride,
  FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY,
  fetchServerFeatureToggleValues,
  parseFeatureToggleOverrides,
  readFeatureToggleOverrides,
  serializeFeatureToggleOverrides,
  setFeatureToggleOverride,
} from './featureFlagOverrides';

describe('featureFlagOverrides', () => {
  const originalFeatureToggles = config.featureToggles;
  const originalFeatureTogglesFromServer = config.featureTogglesFromServer;
  const originalNamespace = config.namespace;
  const originalOpenFeatureContext = config.openFeatureContext;
  const originalBackendSrv = getBackendSrv();

  beforeEach(() => {
    window.localStorage.clear();
    config.featureToggles = {};
    config.featureTogglesFromServer = {};
    config.namespace = 'default';
    config.openFeatureContext = {};
  });

  afterEach(() => {
    window.localStorage.clear();
    config.featureToggles = originalFeatureToggles;
    config.featureTogglesFromServer = originalFeatureTogglesFromServer;
    config.namespace = originalNamespace;
    config.openFeatureContext = originalOpenFeatureContext;
    setBackendSrv(originalBackendSrv);
    jest.restoreAllMocks();
  });

  it('parses valid localStorage overrides and ignores malformed values', () => {
    expect(parseFeatureToggleOverrides('flag=true,other=false,third=1,fourth=0,bad=maybe,=true,noValue')).toEqual({
      flag: true,
      other: false,
      third: true,
      fourth: false,
    });
  });

  it('serializes overrides deterministically', () => {
    expect(serializeFeatureToggleOverrides({ zFlag: true, aFlag: false })).toBe('aFlag=false,zFlag=true');
  });

  it('sets an override in localStorage and runtime config', () => {
    setFeatureToggleOverride('grafanaconThemes', true);

    expect(window.localStorage.getItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY)).toBe('grafanaconThemes=true');
    expect(config.featureToggles.grafanaconThemes).toBe(true);
    expect(readFeatureToggleOverrides()).toEqual({ grafanaconThemes: true });
  });

  it('clears one override and restores the fallback runtime value', () => {
    setFeatureToggleOverride('grafanaconThemes', true);
    setFeatureToggleOverride('dashboardNewLayouts', false);

    clearFeatureToggleOverride('grafanaconThemes', false);

    expect(window.localStorage.getItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY)).toBe('dashboardNewLayouts=false');
    expect(config.featureToggles.grafanaconThemes).toBe(false);
    expect(config.featureToggles.dashboardNewLayouts).toBe(false);
  });

  it('clears all overrides and restores fallback runtime values', () => {
    setFeatureToggleOverride('grafanaconThemes', true);
    setFeatureToggleOverride('dashboardNewLayouts', false);

    clearAllFeatureToggleOverrides({ grafanaconThemes: false, dashboardNewLayouts: true });

    expect(window.localStorage.getItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY)).toBeNull();
    expect(config.featureToggles.grafanaconThemes).toBe(false);
    expect(config.featureToggles.dashboardNewLayouts).toBe(true);
  });

  it('fetches server feature flag values from OFREP', async () => {
    const post = jest.fn().mockResolvedValue({
      flags: [
        { key: 'grafanaconThemes', value: true },
        { key: 'queryServiceFromUI', value: false },
      ],
    });
    setBackendSrv({ post } as unknown as BackendSrv);
    config.namespace = 'tenant-a';
    config.openFeatureContext = { stack: 'dev' };

    await expect(fetchServerFeatureToggleValues()).resolves.toEqual({
      grafanaconThemes: true,
      queryServiceFromUI: false,
    });
    expect(post).toHaveBeenCalledWith('/apis/features.grafana.app/v0alpha1/namespaces/tenant-a/ofrep/v1/evaluate/flags', {
      context: {
        targetingKey: 'tenant-a',
        namespace: 'tenant-a',
        stack: 'dev',
      },
    });
  });
});
