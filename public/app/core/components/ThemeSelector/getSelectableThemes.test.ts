import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const featureTogglesBackup = { ...config.featureToggles };

  afterEach(() => {
    config.featureToggles = { ...featureTogglesBackup };
  });

  it('includes new custom themes by default', () => {
    config.featureToggles = {
      ...featureTogglesBackup,
      colorblindThemes: false,
      grafanaconThemes: false,
    };

    const themes = getSelectableThemes();
    const themeIds = themes.map((theme) => theme.id);

    expect(themeIds).toEqual(expect.arrayContaining(['vscode_dark_blue', 'solarized_dark', 'solarized_light']));
  });

  it('still includes colorblind themes behind feature toggle', () => {
    config.featureToggles = {
      ...featureTogglesBackup,
      colorblindThemes: true,
      grafanaconThemes: false,
    };

    const themes = getSelectableThemes();
    const themeIds = themes.map((theme) => theme.id);

    expect(themeIds).toEqual(
      expect.arrayContaining([
        'deuteranopia_protanopia_dark',
        'deuteranopia_protanopia_light',
        'tritanopia_dark',
        'tritanopia_light',
      ])
    );
  });
});
