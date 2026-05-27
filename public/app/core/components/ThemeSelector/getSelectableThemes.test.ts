import { getBuiltInThemes } from '@grafana/data';

import { getSelectableThemes } from './getSelectableThemes';

jest.mock('@grafana/data', () => ({
  getBuiltInThemes: jest.fn(() => []),
}));

jest.mock('@grafana/runtime', () => ({
  config: {
    featureToggles: {
      grafanaconThemes: false,
      colorblindThemes: false,
    },
  },
}));

const { config } = jest.requireMock('@grafana/runtime');

describe('getSelectableThemes', () => {
  const originalGrafanaConThemesFlag = config.featureToggles.grafanaconThemes;
  const originalColorblindThemesFlag = config.featureToggles.colorblindThemes;

  afterEach(() => {
    config.featureToggles.grafanaconThemes = originalGrafanaConThemesFlag;
    config.featureToggles.colorblindThemes = originalColorblindThemesFlag;
    jest.clearAllMocks();
  });

  it('always includes the aubergine theme without optional bundles', () => {
    config.featureToggles.grafanaconThemes = false;
    config.featureToggles.colorblindThemes = false;

    getSelectableThemes();

    expect(getBuiltInThemes).toHaveBeenCalledWith(['aubergine']);
  });

  it('includes grafanacon extra themes plus aubergine when grafanacon bundle is enabled', () => {
    config.featureToggles.grafanaconThemes = true;
    config.featureToggles.colorblindThemes = false;

    getSelectableThemes();

    expect(getBuiltInThemes).toHaveBeenCalledWith([
      'aubergine',
      'desertbloom',
      'gildedgrove',
      'sapphiredusk',
      'tron',
      'gloom',
    ]);
  });

  it('includes accessibility themes plus aubergine when colorblind themes toggle is enabled', () => {
    config.featureToggles.grafanaconThemes = false;
    config.featureToggles.colorblindThemes = true;

    getSelectableThemes();

    expect(getBuiltInThemes).toHaveBeenCalledWith([
      'aubergine',
      'deuteranopia_protanopia_dark',
      'deuteranopia_protanopia_light',
      'tritanopia_dark',
      'tritanopia_light',
    ]);
  });

  it('includes aubergine, grafanacon, and accessibility themes when both toggles are enabled', () => {
    config.featureToggles.grafanaconThemes = true;
    config.featureToggles.colorblindThemes = true;

    getSelectableThemes();

    expect(getBuiltInThemes).toHaveBeenCalledWith([
      'aubergine',
      'deuteranopia_protanopia_dark',
      'deuteranopia_protanopia_light',
      'tritanopia_dark',
      'tritanopia_light',
      'desertbloom',
      'gildedgrove',
      'sapphiredusk',
      'tron',
      'gloom',
    ]);
  });
});
