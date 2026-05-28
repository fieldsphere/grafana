import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  let featureToggles: typeof config.featureToggles;

  beforeEach(() => {
    featureToggles = { ...config.featureToggles };
    config.featureToggles.colorblindThemes = false;
    config.featureToggles.grafanaconThemes = false;
  });

  afterEach(() => {
    config.featureToggles = featureToggles;
  });

  it('includes the Amethyst theme by default', () => {
    expect(getSelectableThemes().map((theme) => theme.id)).toEqual(['dark', 'light', 'system', 'amethyst']);
  });

  it('keeps feature-gated themes hidden by default', () => {
    const themeIds = getSelectableThemes().map((theme) => theme.id);

    expect(themeIds).not.toContain('desertbloom');
    expect(themeIds).not.toContain('deuteranopia_protanopia_dark');
  });
});
