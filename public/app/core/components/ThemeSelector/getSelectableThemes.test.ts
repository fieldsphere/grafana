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

  it('includes amethyst when grafanaconThemes feature toggle is enabled', () => {
    config.featureToggles = { ...featureTogglesBackup, grafanaconThemes: true };

    const ids = getSelectableThemes().map((theme) => theme.id);

    expect(ids).toContain('amethyst');
  });
});
