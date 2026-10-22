import {
  formatFeatureToggleOverrides,
  getFeatureToggleRows,
  parseFeatureToggleOverrides,
} from './featureFlagOverrides';

describe('feature flag overrides', () => {
  it('parses Grafana feature toggle local storage values', () => {
    expect(parseFeatureToggleOverrides('flagA=1,flagB=0,flagC=true,flagD=false')).toEqual({
      flagA: true,
      flagB: false,
      flagC: true,
      flagD: false,
    });
  });

  it('formats overrides in a stable order', () => {
    expect(formatFeatureToggleOverrides({ flagB: false, flagA: true })).toBe('flagA=1,flagB=0');
  });

  it('returns enabled flags and locally overridden flags', () => {
    expect(
      getFeatureToggleRows(
        {
          disabledServerFlag: false,
          enabledServerFlag: true,
        },
        {
          disabledServerFlag: true,
          enabledServerFlag: false,
        }
      )
    ).toEqual([
      {
        name: 'disabledServerFlag',
        enabled: true,
        hasOverride: true,
      },
      {
        name: 'enabledServerFlag',
        enabled: false,
        hasOverride: true,
      },
    ]);
  });
});
