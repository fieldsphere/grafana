import {
  FEATURE_TOGGLES_LOCAL_STORAGE_KEY,
  getFeatureFlagEntries,
  parseFeatureToggleOverrides,
  removeFeatureToggleOverride,
  serializeFeatureToggleOverrides,
  setFeatureToggleOverride,
} from './featureFlagOverrides';

describe('featureFlagOverrides', () => {
  it('parses localStorage override values', () => {
    expect(parseFeatureToggleOverrides('panelEditor=1,panelInspector=true,disabledFlag=0')).toEqual({
      panelEditor: true,
      panelInspector: true,
      disabledFlag: false,
    });
  });

  it('serializes overrides using the existing localStorage format', () => {
    expect(
      serializeFeatureToggleOverrides({
        panelEditor: true,
        panelInspector: false,
      })
    ).toBe('panelEditor=1,panelInspector=0');
  });

  it('builds entries from boot flags and overrides', () => {
    expect(
      getFeatureFlagEntries(
        {
          alphaFlag: true,
          betaFlag: false,
        },
        {
          betaFlag: true,
          localOnlyFlag: true,
        }
      )
    ).toEqual([
      {
        name: 'alphaFlag',
        bootValue: true,
        effectiveValue: true,
        hasOverride: false,
      },
      {
        name: 'betaFlag',
        bootValue: false,
        effectiveValue: true,
        hasOverride: true,
      },
      {
        name: 'localOnlyFlag',
        bootValue: false,
        effectiveValue: true,
        hasOverride: true,
      },
    ]);
  });

  it('sets and removes overrides immutably', () => {
    const initialOverrides = { alphaFlag: true };

    expect(setFeatureToggleOverride(initialOverrides, 'betaFlag', false)).toEqual({
      alphaFlag: true,
      betaFlag: false,
    });
    expect(removeFeatureToggleOverride(initialOverrides, 'alphaFlag')).toEqual({});
  });

  it('returns an empty object for blank localStorage values', () => {
    expect(parseFeatureToggleOverrides(null)).toEqual({});
    expect(parseFeatureToggleOverrides('')).toEqual({});
  });

  it('uses the expected localStorage key', () => {
    expect(FEATURE_TOGGLES_LOCAL_STORAGE_KEY).toBe('grafana.featureToggles');
  });
});
