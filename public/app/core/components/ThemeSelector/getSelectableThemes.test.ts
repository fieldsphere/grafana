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

  it('includes the amethyst theme in the theme switcher options', () => {
    config.featureToggles = {};

    expect(getSelectableThemes().map((theme) => theme.id)).toContain('amethyst');
  });
});
