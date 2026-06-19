import { render, screen, within } from 'test/test-utils';

import { type FeatureToggles, store } from '@grafana/data';
import { config } from '@grafana/runtime';

import FeatureFlagsDashboard from './FeatureFlagsDashboard';
import { FEATURE_TOGGLE_STORAGE_KEY } from './featureFlagOverrides';

describe('FeatureFlagsDashboard', () => {
  const originalFeatureToggles = config.featureToggles;

  beforeEach(() => {
    store.delete(FEATURE_TOGGLE_STORAGE_KEY);
    config.featureToggles = {
      alphaFeature: true,
      betaFeature: true,
    } as FeatureToggles;
  });

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
    store.delete(FEATURE_TOGGLE_STORAGE_KEY);
  });

  it('renders enabled feature flags from Grafana config', () => {
    render(<FeatureFlagsDashboard />);

    expect(screen.getByText('Feature flags')).toBeInTheDocument();
    expect(screen.getByText('alphaFeature')).toBeInTheDocument();
    expect(screen.getByText('betaFeature')).toBeInTheDocument();
    expect(screen.getAllByText('Server config')).toHaveLength(2);
  });

  it('persists local overrides when a flag is toggled', async () => {
    const { user } = render(<FeatureFlagsDashboard />);

    await user.click(screen.getByLabelText('Set alphaFeature feature flag'));

    expect(store.get(FEATURE_TOGGLE_STORAGE_KEY)).toBe('alphaFeature=false');
    expect(screen.getByText('Reload needed')).toBeInTheDocument();

    const alphaRow = screen.getByText('alphaFeature').closest('tr');
    expect(alphaRow).not.toBeNull();
    expect(within(alphaRow!).getByText('Local override')).toBeInTheDocument();
    expect(within(alphaRow!).getByText('Disabled')).toBeInTheDocument();
  });

  it('shows disabled local overrides and filters by disabled state', async () => {
    store.set(FEATURE_TOGGLE_STORAGE_KEY, 'disabledFeature=false');

    const { user } = render(<FeatureFlagsDashboard />);

    expect(screen.getByText('disabledFeature')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Disabled feature flags'));

    expect(screen.getByText('disabledFeature')).toBeInTheDocument();
    expect(screen.queryByText('alphaFeature')).not.toBeInTheDocument();
    expect(screen.queryByText('betaFeature')).not.toBeInTheDocument();
  });

  it('clears all local overrides', async () => {
    store.set(FEATURE_TOGGLE_STORAGE_KEY, 'disabledFeature=false');
    const { user } = render(<FeatureFlagsDashboard />);

    await user.click(screen.getByText('Clear local overrides'));

    expect(store.get(FEATURE_TOGGLE_STORAGE_KEY)).toBeUndefined();
    expect(screen.queryByText('disabledFeature')).not.toBeInTheDocument();
    expect(screen.getByText('Reload needed')).toBeInTheDocument();
  });
});
