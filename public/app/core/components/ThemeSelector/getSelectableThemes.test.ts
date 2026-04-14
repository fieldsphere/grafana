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

  it('includes amethyst when grafanacon themes are enabled', () => {
    config.featureToggles.grafanaconThemes = true;
    config.featureToggles.colorblindThemes = false;

    const selectableThemeIds = getSelectableThemes().map((theme) => theme.id);

    expect(selectableThemeIds).toContain('amethyst');
  });

  it('does not include amethyst when grafanacon themes are disabled', () => {
    config.featureToggles.grafanaconThemes = false;
    config.featureToggles.colorblindThemes = false;

    const selectableThemeIds = getSelectableThemes().map((theme) => theme.id);

    expect(selectableThemeIds).not.toContain('amethyst');
  });
});
