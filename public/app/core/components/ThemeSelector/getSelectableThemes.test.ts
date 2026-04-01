import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const originalFeatureToggles = config.featureToggles;

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('does not include extra themes when grafanacon themes are disabled', () => {
    config.featureToggles = { ...originalFeatureToggles, grafanaconThemes: false };

    expect(getSelectableThemes().map((theme) => theme.id)).toEqual(['dark', 'light', 'system']);
  });

  it('includes the aubergine theme when grafanacon themes are enabled', () => {
    config.featureToggles = { ...originalFeatureToggles, grafanaconThemes: true };

    expect(getSelectableThemes().map((theme) => theme.id)).toContain('aubergine');
  });
});
