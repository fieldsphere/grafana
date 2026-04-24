import { getSelectableThemes } from './getSelectableThemes';

jest.mock('@grafana/runtime', () => ({
  config: {
    featureToggles: {},
  },
}));

jest.mock('@grafana/data', () => ({
  getBuiltInThemes: jest.fn((allowedExtraThemes: string[]) => allowedExtraThemes),
}));

const { config } = jest.requireMock('@grafana/runtime');
const { getBuiltInThemes } = jest.requireMock('@grafana/data');

describe('getSelectableThemes', () => {
  beforeEach(() => {
    config.featureToggles = {};
    getBuiltInThemes.mockClear();
  });

  it('includes amethyst when grafanacon themes are enabled', () => {
    config.featureToggles = { grafanaconThemes: true };

    getSelectableThemes();

    expect(getBuiltInThemes).toHaveBeenCalledWith(
      expect.arrayContaining(['desertbloom', 'gildedgrove', 'sapphiredusk', 'tron', 'gloom', 'amethyst'])
    );
  });

  it('does not include amethyst when grafanacon themes are disabled', () => {
    config.featureToggles = { grafanaconThemes: false };

    getSelectableThemes();

    expect(getBuiltInThemes).toHaveBeenCalledWith(expect.not.arrayContaining(['amethyst']));
  });
});
