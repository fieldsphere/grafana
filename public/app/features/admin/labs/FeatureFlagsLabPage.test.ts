import { getEnabledFeatureFlagNames } from './featureFlagUtils';

describe('getEnabledFeatureFlagNames', () => {
  it('returns enabled feature flags in sorted order', () => {
    expect(
      getEnabledFeatureFlagNames({
        zebraToggle: true,
        alphaToggle: true,
        disabledToggle: false,
        unsetToggle: undefined,
      })
    ).toEqual(['alphaToggle', 'zebraToggle']);
  });
});
