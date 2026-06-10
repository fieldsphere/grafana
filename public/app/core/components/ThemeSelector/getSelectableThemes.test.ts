import { getBuiltInThemes, type ThemeRegistryItem } from '@grafana/data';
import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

jest.mock('@grafana/data', () => {
  const actualData = jest.requireActual('@grafana/data');
  return {
    ...actualData,
    getBuiltInThemes: jest.fn(),
  };
});

describe('getSelectableThemes', () => {
  const mockedGetBuiltInThemes = getBuiltInThemes as jest.MockedFunction<typeof getBuiltInThemes>;
  let featureToggleBackup: typeof config.featureToggles;

  beforeEach(() => {
    featureToggleBackup = { ...config.featureToggles };
    mockedGetBuiltInThemes.mockReset();
    mockedGetBuiltInThemes.mockReturnValue([] as ThemeRegistryItem[]);
  });

  afterEach(() => {
    config.featureToggles = featureToggleBackup;
  });

  it('includes amethyst when grafanacon themes are enabled', () => {
    config.featureToggles = {
      ...config.featureToggles,
      colorblindThemes: false,
      grafanaconThemes: true,
    };

    getSelectableThemes();

    expect(mockedGetBuiltInThemes).toHaveBeenCalledWith([
      'amethyst',
      'desertbloom',
      'gildedgrove',
      'sapphiredusk',
      'tron',
      'gloom',
    ]);
  });

  it('does not include amethyst when grafanacon themes are disabled', () => {
    config.featureToggles = {
      ...config.featureToggles,
      colorblindThemes: true,
      grafanaconThemes: false,
    };

    getSelectableThemes();

    expect(mockedGetBuiltInThemes).toHaveBeenCalledWith([
      'deuteranopia_protanopia_dark',
      'deuteranopia_protanopia_light',
      'tritanopia_dark',
      'tritanopia_light',
    ]);
  });
});
