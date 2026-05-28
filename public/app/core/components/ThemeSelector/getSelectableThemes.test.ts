import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  let featureTogglesBackup: typeof config.featureToggles;

  beforeAll(() => {
    featureTogglesBackup = { ...config.featureToggles };
  });

  afterEach(() => {
    config.featureToggles = { ...featureTogglesBackup };
  });

  it('includes amethyst when grafanaconThemes is enabled', () => {
    config.featureToggles.grafanaconThemes = true;
    const themes = getSelectableThemes();

    expect(themes.some((theme) => theme.id === 'amethyst')).toBe(true);
  });

  it('does not include amethyst when grafanaconThemes is disabled', () => {
    config.featureToggles.grafanaconThemes = false;
    const themes = getSelectableThemes();

    expect(themes.some((theme) => theme.id === 'amethyst')).toBe(false);
  });
});
