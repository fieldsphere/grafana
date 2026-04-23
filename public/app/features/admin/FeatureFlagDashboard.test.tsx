import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import config from 'app/core/config';
import { contextSrv } from 'app/core/services/context_srv';

import { TestProvider } from '../../../test/helpers/TestProvider';
import FeatureFlagDashboard from './FeatureFlagDashboard';

describe('FeatureFlagDashboard', () => {
  const originalFeatureToggles = { ...config.featureToggles };
  const hasPermissionSpy = jest.spyOn(contextSrv, 'hasPermission');
  const localStorageGetSpy = jest.spyOn(Storage.prototype, 'getItem');
  const localStorageSetSpy = jest.spyOn(Storage.prototype, 'setItem');
  const localStorageRemoveSpy = jest.spyOn(Storage.prototype, 'removeItem');

  beforeEach(() => {
    window.localStorage.clear();
    config.featureToggles = {
      ...originalFeatureToggles,
      alphaFeature: false,
      betaFeature: true,
      gammaFeature: false,
    };

    hasPermissionSpy.mockImplementation((permission: string) => permission === 'featuremgmt.write');
  });

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
    jest.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <TestProvider>
        <FeatureFlagDashboard />
      </TestProvider>
    );

  it('renders feature flags from config', () => {
    renderPage();

    expect(screen.getByText('alphaFeature')).toBeInTheDocument();
    expect(screen.getByText('betaFeature')).toBeInTheDocument();
    expect(screen.getByText('gammaFeature')).toBeInTheDocument();
  });

  it('filters feature flags by search term', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByTestId('feature-flag-dashboard-search'), 'beta');

    expect(screen.queryByText('alphaFeature')).not.toBeInTheDocument();
    expect(screen.getByText('betaFeature')).toBeInTheDocument();
  });

  it('writes toggle overrides to local storage', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('switch', { name: 'alphaFeature' }));

    expect(localStorageSetSpy).toHaveBeenCalled();
    expect(localStorageGetSpy).toHaveBeenCalledWith('grafana.featureToggles');
  });

  it('resets local overrides', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('grafana.featureToggles', 'alphaFeature=true');

    renderPage();
    await user.click(screen.getByTestId('feature-flag-dashboard-reset'));

    expect(localStorageRemoveSpy).toHaveBeenCalledWith('grafana.featureToggles');
  });

  it('renders read-only state without write permission', () => {
    hasPermissionSpy.mockReturnValue(false);

    renderPage();

    expect(screen.getByText('Read-only access')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset local overrides' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'alphaFeature' })).toBeDisabled();
  });
});
