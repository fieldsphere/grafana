import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const originalFeatureToggles = { ...config.featureToggles };

  beforeEach(() => {
    config.featureToggles = { ...originalFeatureToggles };
  });

  afterAll(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('includes amethyst when grafanacon themes are enabled', () => {
    config.featureToggles.grafanaconThemes = true;
    config.featureToggles.colorblindThemes = false;

    const themes = getSelectableThemes();

    expect(themes.some((theme) => theme.id === 'amethyst')).toBe(true);
  });

  it('does not include amethyst when grafanacon themes are disabled', () => {
    config.featureToggles.grafanaconThemes = false;

    const themes = getSelectableThemes();

    expect(themes.some((theme) => theme.id === 'amethyst')).toBe(false);
  });
});
