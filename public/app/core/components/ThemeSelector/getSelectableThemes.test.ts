import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const originalGrafanaconThemes = config.featureToggles.grafanaconThemes;

  afterEach(() => {
    config.featureToggles.grafanaconThemes = originalGrafanaconThemes;
  });

  it('includes the nineties theme when experimental themes are enabled', () => {
    config.featureToggles.grafanaconThemes = true;

    expect(getSelectableThemes().map((theme) => theme.id)).toContain('nineties');
  });

  it('excludes extra themes when experimental themes are disabled', () => {
    config.featureToggles.grafanaconThemes = false;

    expect(getSelectableThemes().map((theme) => theme.id)).not.toContain('nineties');
  });
});
