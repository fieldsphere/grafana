import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const originalGrafanaconThemes = config.featureToggles.grafanaconThemes;
  const originalColorblindThemes = config.featureToggles.colorblindThemes;

  afterEach(() => {
    config.featureToggles.grafanaconThemes = originalGrafanaconThemes;
    config.featureToggles.colorblindThemes = originalColorblindThemes;
  });

  it('does not include amethyst when grafanacon themes are disabled', () => {
    config.featureToggles.grafanaconThemes = false;
    config.featureToggles.colorblindThemes = false;

    const themeIds = getSelectableThemes().map((theme) => theme.id);

    expect(themeIds).not.toContain('amethyst');
  });

  it('includes amethyst when grafanacon themes are enabled', () => {
    config.featureToggles.grafanaconThemes = true;
    config.featureToggles.colorblindThemes = false;

    const themeIds = getSelectableThemes().map((theme) => theme.id);

    expect(themeIds).toContain('amethyst');
  });
});
