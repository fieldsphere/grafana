import { getBuiltInThemes, type ThemeRegistryItem } from '@grafana/data';
import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

jest.mock('@grafana/data', () => {
  const actual = jest.requireActual('@grafana/data');
  return {
    ...actual,
    getBuiltInThemes: jest.fn(),
  };
});

const getBuiltInThemesMock = jest.mocked(getBuiltInThemes);

describe('getSelectableThemes', () => {
  beforeEach(() => {
    getBuiltInThemesMock.mockReset();
    getBuiltInThemesMock.mockReturnValue([] as ThemeRegistryItem[]);
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
    config.featureToggles.grafanaconThemes = false;

    getSelectableThemes();

    const [allowedExtras] = getBuiltInThemesMock.mock.calls[0];
    expect(allowedExtras).not.toContain('amethyst');
  });

  it('includes colorblind themes only when colorblind toggle is enabled', () => {
    config.featureToggles.colorblindThemes = true;

    getSelectableThemes();

    expect(getBuiltInThemesMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        'deuteranopia_protanopia_dark',
        'deuteranopia_protanopia_light',
        'tritanopia_dark',
        'tritanopia_light',
      ])
    );
  });
});
