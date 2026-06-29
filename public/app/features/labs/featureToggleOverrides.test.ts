import { store } from '@grafana/data';

import {
  FEATURE_TOGGLE_STORAGE_KEY,
  getFeatureToggleOverrides,
  parseFeatureToggleOverrides,
  removeFeatureToggleOverride,
  saveFeatureToggleOverrides,
  serializeFeatureToggleOverrides,
  setFeatureToggleOverride,
} from './featureToggleOverrides';

describe('featureToggleOverrides', () => {
  afterEach(() => {
    store.delete(FEATURE_TOGGLE_STORAGE_KEY);
  });

  it('parses Grafana feature toggle override values', () => {
    expect(parseFeatureToggleOverrides('alpha=1,beta=0,gamma=true,delta=false')).toEqual({
      alpha: true,
      beta: false,
      delta: false,
      gamma: true,
    });
  });

  it('skips empty and malformed override entries', () => {
    expect(parseFeatureToggleOverrides('alpha=1,,missingValue,beta=0')).toEqual({
      alpha: true,
      beta: false,
    });
  });

  it('serializes overrides in a stable order', () => {
    expect(serializeFeatureToggleOverrides({ zeta: false, alpha: true })).toBe('alpha=1,zeta=0');
  });

  it('saves, updates, and removes overrides', () => {
    setFeatureToggleOverride('alpha', true);
    setFeatureToggleOverride('beta', false);

    expect(getFeatureToggleOverrides()).toEqual({
      alpha: true,
      beta: false,
    });

    removeFeatureToggleOverride('alpha');

    expect(getFeatureToggleOverrides()).toEqual({
      beta: false,
    });
  });

  it('deletes the storage key when saving no overrides', () => {
    setFeatureToggleOverride('alpha', true);
    saveFeatureToggleOverrides({});

    expect(store.get(FEATURE_TOGGLE_STORAGE_KEY)).toBeUndefined();
  });
});
