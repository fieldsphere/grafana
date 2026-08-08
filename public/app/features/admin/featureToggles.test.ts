import { config } from '@grafana/runtime';

import {
  applyFeatureToggleOverride,
  getFeatureToggleRows,
  parseFeatureToggleOverrides,
  serializeFeatureToggleOverrides,
  writeFeatureToggleOverrides,
  FEATURE_TOGGLE_LOCAL_STORAGE_KEY,
} from './featureToggles';

describe('feature toggle admin helpers', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('parses and serializes local feature toggle overrides', () => {
    expect(parseFeatureToggleOverrides('panelTitleSearch=true,lokiQuerySplitting=0,customFlag=1')).toEqual({
      panelTitleSearch: true,
      lokiQuerySplitting: false,
      customFlag: true,
    });

    expect(serializeFeatureToggleOverrides({ zedFlag: false, alphaFlag: true })).toBe(
      'alphaFlag=true,zedFlag=false'
    );
  });

  it('removes localStorage key when writing empty overrides', () => {
    window.localStorage.setItem(FEATURE_TOGGLE_LOCAL_STORAGE_KEY, 'panelTitleSearch=true');

    writeFeatureToggleOverrides({});

    expect(window.localStorage.getItem(FEATURE_TOGGLE_LOCAL_STORAGE_KEY)).toBeNull();
  });

  it('combines known flags, boot flags, and overrides into rows', () => {
    const rows = getFeatureToggleRows({ panelTitleSearch: true, runtimeOnlyFlag: true }, { customFlag: false });

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'panelTitleSearch', enabled: true, hasOverride: false }),
        expect.objectContaining({ name: 'runtimeOnlyFlag', enabled: true, hasOverride: false }),
        expect.objectContaining({ name: 'customFlag', enabled: false, hasOverride: true, overrideValue: false }),
      ])
    );
  });

  it('applies an override to runtime config and boot data', () => {
    applyFeatureToggleOverride('panelTitleSearch', true);

    expect(config.featureToggles.panelTitleSearch).toBe(true);
    expect(config.bootData.settings.featureToggles.panelTitleSearch).toBe(true);
  });
});
