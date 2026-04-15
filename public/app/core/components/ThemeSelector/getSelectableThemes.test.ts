import { getBuiltInThemes } from '@grafana/data';
import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

jest.mock('@grafana/data', () => ({
  getBuiltInThemes: jest.fn(),
}));

jest.mock('@grafana/runtime', () => ({
  config: {
    featureToggles: {
      colorblindThemes: false,
      grafanaconThemes: false,
    },
  },
}));

const getBuiltInThemesMock = jest.mocked(getBuiltInThemes);

describe('getSelectableThemes', () => {
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

  it('does not include amethyst when grafanacon themes are disabled', () => {
    getSelectableThemes();

    expect(getBuiltInThemesMock).toHaveBeenCalledWith(expect.not.arrayContaining(['amethyst']));
  });
});
