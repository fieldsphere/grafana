import { config } from '@grafana/runtime';
import { render, screen, within } from 'test/test-utils';

import { FeatureFlagsDashboardContent } from './FeatureFlagsPage';

describe('FeatureFlagsDashboardContent', () => {
  beforeEach(() => {
    window.localStorage.clear();
    config.featureToggles = {
      disabledFeature: false,
      enabledFeature: true,
      anotherEnabledFeature: true,
    };
  });

  afterEach(() => {
    window.localStorage.clear();
    config.featureToggles = {};
  });

  it('shows enabled feature flags from boot config', () => {
    render(<FeatureFlagsDashboardContent />);

    expect(screen.getByText('enabledFeature')).toBeInTheDocument();
    expect(screen.getByText('anotherEnabledFeature')).toBeInTheDocument();
    expect(screen.queryByText('disabledFeature')).not.toBeInTheDocument();
    expect(screen.getByText('Enabled at boot')).toBeInTheDocument();
  });

  it('controls feature flags in the current browser session', async () => {
    const { user } = render(<FeatureFlagsDashboardContent />);

    await user.click(screen.getByRole('switch', { name: 'Toggle enabledFeature' }));

    expect(config.featureToggles.enabledFeature).toBe(false);
    expect(within(screen.getByText('enabledFeature').closest('tr')!).getByText('Disabled locally')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset browser overrides' }));

    expect(config.featureToggles.enabledFeature).toBe(true);
    expect(within(screen.getByText('enabledFeature').closest('tr')!).getByText('Enabled')).toBeInTheDocument();
  });
});
