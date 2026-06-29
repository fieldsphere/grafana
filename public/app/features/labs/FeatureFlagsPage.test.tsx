import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import config from 'app/core/config';

import { TestProvider } from '../../../test/helpers/TestProvider';

import FeatureFlagsPage from './FeatureFlagsPage';
import { FEATURE_TOGGLES_LOCAL_STORAGE_KEY } from './featureFlagOverrides';

const renderPage = () => {
  render(
    <TestProvider>
      <FeatureFlagsPage />
    </TestProvider>
  );
};

describe('FeatureFlagsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    config.featureToggles = {
      alphaFlag: true,
      betaFlag: false,
    } as typeof config.featureToggles;
  });

  it('renders enabled flags from config.featureToggles', async () => {
    renderPage();

    expect(await screen.findByText('alphaFlag')).toBeInTheDocument();
    expect(screen.getByText('betaFlag')).toBeInTheDocument();
    expect(screen.getByText('Browser-local feature flag overrides')).toBeInTheDocument();
  });

  it('writes grafana.featureToggles when a flag is toggled', async () => {
    const user = userEvent.setup();
    renderPage();

    const switches = await screen.findAllByRole('switch');
    await user.click(switches[1]);

    expect(window.localStorage.getItem(FEATURE_TOGGLES_LOCAL_STORAGE_KEY)).toBe('betaFlag=1');
    expect(screen.getByText('Reload required')).toBeInTheDocument();
  });

  it('removes a flag override when reset is clicked', async () => {
    window.localStorage.setItem(FEATURE_TOGGLES_LOCAL_STORAGE_KEY, 'betaFlag=1');
    const user = userEvent.setup();
    renderPage();

    const betaFlagRow = (await screen.findByText('betaFlag')).closest('tr');
    expect(betaFlagRow).not.toBeNull();

    await user.click(within(betaFlagRow!).getByRole('button', { name: 'Reset' }));

    expect(window.localStorage.getItem(FEATURE_TOGGLES_LOCAL_STORAGE_KEY)).toBeNull();
    expect(screen.getByText('Reload required')).toBeInTheDocument();
  });

  it('shows a reload prompt after changing overrides', async () => {
    const user = userEvent.setup();
    renderPage();

    const switches = await screen.findAllByRole('switch');
    await user.click(switches[0]);

    expect(screen.getByText('Reload required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload Grafana' })).toBeInTheDocument();
  });
});
