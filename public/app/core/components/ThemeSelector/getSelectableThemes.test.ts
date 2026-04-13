import { getBuiltInThemes } from '@grafana/data';
import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

jest.mock('@grafana/data', () => ({
  ...jest.requireActual('@grafana/data'),
  getBuiltInThemes: jest.fn(),
}));

describe('getSelectableThemes', () => {
  const mockGetBuiltInThemes = getBuiltInThemes as jest.MockedFunction<typeof getBuiltInThemes>;
  const originalFeatureToggles = { ...config.featureToggles };

  beforeEach(() => {
    mockGetBuiltInThemes.mockClear();
    mockGetBuiltInThemes.mockReturnValue([]);
    config.featureToggles = { ...originalFeatureToggles };
  });

  afterAll(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('includes warm ember in experimental themes', () => {
    config.featureToggles.grafanaconThemes = true;
    config.featureToggles.colorblindThemes = false;

    getSelectableThemes();

    expect(mockGetBuiltInThemes).toHaveBeenCalledWith([
      'desertbloom',
      'gildedgrove',
      'sapphiredusk',
      'tron',
      'gloom',
      'warmember',
    ]);
  });
});
