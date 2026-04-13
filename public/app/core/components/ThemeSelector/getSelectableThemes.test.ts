import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const originalFeatureToggles = { ...config.featureToggles };

  afterEach(() => {
    config.featureToggles = { ...originalFeatureToggles };
  });

  it('includes amethyst when grafanacon themes are enabled', () => {
    config.featureToggles = {
      ...originalFeatureToggles,
      grafanaconThemes: true,
      colorblindThemes: false,
    };

    const selectableThemeIds = getSelectableThemes().map((theme) => theme.id);

    expect(selectableThemeIds).toContain('amethyst');
  });

  it('does not include amethyst when grafanacon themes are disabled', () => {
    config.featureToggles = {
      ...originalFeatureToggles,
      grafanaconThemes: false,
      colorblindThemes: false,
    };

    const selectableThemeIds = getSelectableThemes().map((theme) => theme.id);

    expect(selectableThemeIds).not.toContain('amethyst');
  });
});
