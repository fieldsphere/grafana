import { getFeatureToggleRows, parseFeatureToggleOverrides, serializeFeatureToggleOverrides } from './utils';

describe('labs feature toggle utils', () => {
  it('parses local storage feature toggle overrides', () => {
    expect(parseFeatureToggleOverrides('panelTitleSearch=1,featureHighlights=false')).toEqual({
      panelTitleSearch: true,
      featureHighlights: false,
    });
  });

  it('serializes local storage feature toggle overrides', () => {
    expect(serializeFeatureToggleOverrides({ featureHighlights: false, panelTitleSearch: true })).toBe(
      'featureHighlights=0,panelTitleSearch=1'
    );
  });

  it('builds rows from enabled feature toggles and overrides', () => {
    expect(
      getFeatureToggleRows(
        { panelTitleSearch: true, publicDashboardsEmailSharing: false },
        { featureHighlights: false }
      )
    ).toEqual([
      { name: 'featureHighlights', enabled: false, isOverridden: true },
      { name: 'panelTitleSearch', enabled: true, isOverridden: false },
    ]);
  });
});
