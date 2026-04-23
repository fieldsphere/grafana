import { getBuiltInThemes } from '@grafana/data';
import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

jest.mock('@grafana/data', () => ({
  ...jest.requireActual('@grafana/data'),
  getBuiltInThemes: jest.fn(),
}));

describe('getSelectableThemes', () => {
  const getBuiltInThemesMock = getBuiltInThemes as jest.Mock;

  beforeEach(() => {
    getBuiltInThemesMock.mockReturnValue([]);
    config.featureToggles.colorblindThemes = false;
    config.featureToggles.grafanaconThemes = false;
  });

  it('includes amethyst when grafanacon themes are enabled', () => {
    config.featureToggles.grafanaconThemes = true;

    getSelectableThemes();

    expect(getBuiltInThemesMock).toHaveBeenCalledWith(
      expect.arrayContaining(['amethyst', 'desertbloom', 'gildedgrove', 'sapphiredusk', 'tron', 'gloom'])
    );
  });
});
