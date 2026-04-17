import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  let originalFeatureToggles: typeof config.featureToggles;

  beforeEach(() => {
    originalFeatureToggles = { ...config.featureToggles };
    config.featureToggles = { ...config.featureToggles };
  });

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('includes amethyst when grafanacon themes are enabled', () => {
    config.featureToggles.grafanaconThemes = true;

    const themes = getSelectableThemes();

    expect(themes.some((theme) => theme.id === 'amethyst')).toBe(true);
  });

  it('does not include amethyst when grafanacon themes are disabled', () => {
    config.featureToggles.grafanaconThemes = false;

    const themes = getSelectableThemes();

    expect(themes.some((theme) => theme.id === 'amethyst')).toBe(false);
  });
});
