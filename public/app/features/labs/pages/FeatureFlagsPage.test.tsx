import { screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import config from 'app/core/config';

import { FEATURE_TOGGLE_STORAGE_KEY } from '../constants';

import { FeatureFlagsPageContent } from './FeatureFlagsPage';

describe('FeatureFlagsPageContent', () => {
  const originalFeatureToggles = config.featureToggles;

  beforeEach(() => {
    config.featureToggles = {
      panelTitleSearch: true,
      featureHighlights: true,
    };
    window.localStorage.clear();
  });

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
    window.localStorage.clear();
  });

  it('lists enabled feature flags', () => {
    render(<FeatureFlagsPageContent />);

    expect(screen.getByText('panelTitleSearch')).toBeInTheDocument();
    expect(screen.getByText('featureHighlights')).toBeInTheDocument();
  });

  it('stores a local override when a flag is toggled', async () => {
    const { user } = render(<FeatureFlagsPageContent />);

    await user.click(screen.getByLabelText('Toggle panelTitleSearch'));

    expect(window.localStorage.getItem(FEATURE_TOGGLE_STORAGE_KEY)).toBe('panelTitleSearch=0');
    expect(config.featureToggles.panelTitleSearch).toBe(false);
    expect(screen.getByText('Local override')).toBeInTheDocument();
  });

  it('shows disabled local overrides so they can be restored', () => {
    window.localStorage.setItem(FEATURE_TOGGLE_STORAGE_KEY, 'panelTitleSearch=0');
    config.featureToggles.panelTitleSearch = false;

    render(<FeatureFlagsPageContent />);

    expect(screen.getByText('panelTitleSearch')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByText('Local override')).toBeInTheDocument();
  });
});
