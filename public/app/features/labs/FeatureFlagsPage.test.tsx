import { render, screen, userEvent } from 'test/test-utils';

import { config } from '@grafana/runtime';

import FeatureFlagsPage from './FeatureFlagsPage';

describe('FeatureFlagsPage', () => {
  const originalFeatureToggles = config.featureToggles;

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('shows enabled feature flags and allows changing their local runtime state', async () => {
    config.featureToggles = {
      alphaFlag: true,
      disabledFlag: false,
      betaFlag: true,
    };

    render(<FeatureFlagsPage />);

    expect(screen.getByText('2 enabled')).toBeInTheDocument();
    expect(screen.getByText('alphaFlag')).toBeInTheDocument();
    expect(screen.getByText('betaFlag')).toBeInTheDocument();
    expect(screen.queryByText('disabledFlag')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('switch', { name: 'Disable alphaFlag' }));

    expect(screen.getByText('1 enabled')).toBeInTheDocument();
    expect(config.featureToggles.alphaFlag).toBe(false);
  });

  it('can show disabled feature flags on request', async () => {
    config.featureToggles = {
      alphaFlag: true,
      disabledFlag: false,
    };

    render(<FeatureFlagsPage />);

    await userEvent.click(screen.getByLabelText('Show disabled feature flags'));

    expect(screen.getByText('disabledFlag')).toBeInTheDocument();
  });
});
