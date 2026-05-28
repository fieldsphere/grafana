import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const originalGrafanaconThemes = config.featureToggles.grafanaconThemes;

  afterEach(() => {
    config.featureToggles.grafanaconThemes = originalGrafanaconThemes;
  });

  it('includes the 90s theme when experimental themes are enabled', () => {
    config.featureToggles.grafanaconThemes = true;

    const themes = getSelectableThemes();

    expect(themes.map((theme) => theme.id)).toContain('webcore90s');
  });

  it('does not include the 90s theme when experimental themes are disabled', () => {
    config.featureToggles.grafanaconThemes = false;

    const themes = getSelectableThemes();

    expect(themes.map((theme) => theme.id)).not.toContain('webcore90s');
  });
});
