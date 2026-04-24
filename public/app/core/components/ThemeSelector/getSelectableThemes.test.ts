import { getSelectableThemes } from './getSelectableThemes';

const configMock = {
  featureToggles: {},
};

const getBuiltInThemesMock = jest.fn((allowedExtraThemes: string[]) => allowedExtraThemes);

jest.mock('@grafana/runtime', () => ({
  config: configMock,
}));

jest.mock('@grafana/data', () => ({
  getBuiltInThemes: (allowedExtraThemes: string[]) => getBuiltInThemesMock(allowedExtraThemes),
}));

describe('getSelectableThemes', () => {
  beforeEach(() => {
    configMock.featureToggles = {};
    getBuiltInThemesMock.mockClear();
  });

  it('includes amethyst when grafanacon themes are enabled', () => {
    configMock.featureToggles = { grafanaconThemes: true };

    getSelectableThemes();

    expect(getBuiltInThemesMock).toHaveBeenCalledWith(
      expect.arrayContaining(['desertbloom', 'gildedgrove', 'sapphiredusk', 'tron', 'gloom', 'amethyst'])
    );
  });

  it('does not include amethyst when grafanacon themes are disabled', () => {
    configMock.featureToggles = { grafanaconThemes: false };

    getSelectableThemes();

    expect(getBuiltInThemesMock).toHaveBeenCalledWith(expect.not.arrayContaining(['amethyst']));
  });
});
