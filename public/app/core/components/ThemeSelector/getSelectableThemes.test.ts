import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const originalFeatureToggles = { ...config.featureToggles };

  afterEach(() => {
    config.featureToggles = { ...originalFeatureToggles };
  });

  it('includes the Amethyst theme by default', () => {
    config.featureToggles.colorblindThemes = false;
    config.featureToggles.grafanaconThemes = false;

    expect(getSelectableThemes().map((theme) => theme.id)).toContain('amethyst');
  });
});
