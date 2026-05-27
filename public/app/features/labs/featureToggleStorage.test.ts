import { isBrowserToggleable, getLocalFeatureToggleOverrides, setLocalFeatureToggle } from './featureToggleStorage';

describe('featureToggleStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('parses local storage overrides', () => {
    window.localStorage.setItem('grafana.featureToggles', 'alpha=1,beta=0');
    expect(getLocalFeatureToggleOverrides()).toEqual({ alpha: true, beta: false });
  });

  it('writes toggle overrides', () => {
    setLocalFeatureToggle('panelEditor', true);
    expect(window.localStorage.getItem('grafana.featureToggles')).toBe('panelEditor=1');
  });

  it('identifies browser-toggleable flags', () => {
    expect(isBrowserToggleable({ frontendOnly: true })).toBe(true);
    expect(isBrowserToggleable({ frontendOnly: true, requiresRestart: true })).toBe(false);
    expect(isBrowserToggleable({ frontendOnly: false })).toBe(false);
  });
});
