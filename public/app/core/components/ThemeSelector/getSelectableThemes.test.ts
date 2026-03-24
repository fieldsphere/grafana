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

  it('does not include experimental themes when grafanaconThemes is disabled', () => {
    config.featureToggles.grafanaconThemes = false;

    const themeIds = getSelectableThemes().map((theme) => theme.id);

    expect(themeIds).toEqual(['dark', 'light', 'system']);
    expect(themeIds).not.toContain('dialup');
  });

  it('includes the dialup theme when grafanaconThemes is enabled', () => {
    config.featureToggles.grafanaconThemes = true;

    const themeIds = getSelectableThemes().map((theme) => theme.id);

    expect(themeIds).toContain('dialup');
  });
});
