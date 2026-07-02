import { store } from '@grafana/data';

import {
  getFeatureToggleOverrides,
  removeFeatureToggleOverride,
  setFeatureToggleOverride,
} from './featureToggleOverrides';

const STORAGE_KEY = 'grafana.featureToggles';

describe('featureToggleOverrides', () => {
  beforeEach(() => {
    store.delete(STORAGE_KEY);
  });

  afterEach(() => {
    store.delete(STORAGE_KEY);
  });

  it('parses Grafana feature toggle overrides from local storage', () => {
    store.set(STORAGE_KEY, 'panelTitleSearch=1,dashboardTemplates=false,empty=');

    expect(getFeatureToggleOverrides()).toEqual({
      dashboardTemplates: false,
      empty: false,
      panelTitleSearch: true,
    });
  });

  it('writes overrides in a stable format', () => {
    setFeatureToggleOverride('zetaFlag', true);
    setFeatureToggleOverride('alphaFlag', false);

    expect(store.get(STORAGE_KEY)).toBe('alphaFlag=0,zetaFlag=1');
  });

  it('removes the storage key when the last override is reset', () => {
    setFeatureToggleOverride('panelTitleSearch', true);
    removeFeatureToggleOverride('panelTitleSearch');

    expect(store.get(STORAGE_KEY)).toBeUndefined();
  });
});
