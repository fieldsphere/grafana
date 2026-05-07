import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const originalFeatureToggles = config.featureToggles;

  beforeEach(() => {
    config.featureToggles = {
      ...originalFeatureToggles,
      colorblindThemes: false,
      grafanaconThemes: false,
    };
  });

  afterAll(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('excludes Amethyst when GrafanaCON themes are disabled', () => {
    const themes = getSelectableThemes();

    expect(themes.map((theme) => theme.id)).not.toContain('amethyst');
  });

  it('includes Amethyst in the experimental theme switcher set', () => {
    config.featureToggles.grafanaconThemes = true;

    const amethyst = getSelectableThemes().find((theme) => theme.id === 'amethyst');

    expect(amethyst).toMatchObject({
      id: 'amethyst',
      name: 'Amethyst',
      isExtra: true,
    });
  });
});
