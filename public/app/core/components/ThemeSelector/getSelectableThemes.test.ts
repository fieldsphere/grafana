import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const originalFeatureToggles = config.featureToggles;

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('includes Amethyst when GrafanaCon themes are enabled', () => {
    config.featureToggles = { ...originalFeatureToggles, grafanaconThemes: true };

    expect(getSelectableThemes().map((theme) => theme.id)).toContain('amethyst');
  });

  it('does not include Amethyst when GrafanaCon themes are disabled', () => {
    config.featureToggles = { ...originalFeatureToggles, grafanaconThemes: false };

    expect(getSelectableThemes().map((theme) => theme.id)).not.toContain('amethyst');
  });
});
