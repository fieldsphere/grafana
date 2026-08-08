import { screen, waitFor } from '@testing-library/react';

import { render } from 'test/test-utils';

import { getBackendSrv } from '@grafana/runtime';

import FeatureTogglesPage, { type FeatureTogglesResponse } from './FeatureTogglesPage';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: jest.fn(),
}));

const featureToggles: FeatureTogglesResponse = {
  toggles: [
    {
      name: 'newDashboards',
      description: 'Try the new dashboard experience.',
      stage: 'experimental',
      enabled: false,
      frontendOnly: true,
    },
    {
      name: 'backendExperiment',
      description: 'A backend experiment.',
      stage: 'preview',
      enabled: true,
      requiresRestart: true,
    },
    {
      name: 'gaFeature',
      description: 'A generally available feature.',
      stage: 'GA',
      enabled: true,
    },
  ],
};

describe('FeatureTogglesPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.mocked(getBackendSrv).mockReturnValue({
      get: jest.fn().mockResolvedValue(featureToggles),
    } as never);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('filters experiments and persists browser overrides', async () => {
    const { user } = render(<FeatureTogglesPage />);

    expect(await screen.findByRole('heading', { name: 'Experiments' })).toBeInTheDocument();
    expect(screen.getByText('newDashboards')).toBeInTheDocument();
    expect(screen.getByText('backendExperiment')).toBeInTheDocument();
    expect(screen.queryByText('gaFeature')).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search experiments'), 'dash');
    expect(screen.getByText('newDashboards')).toBeInTheDocument();
    expect(screen.queryByText('backendExperiment')).not.toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Toggle newDashboards' }));
    expect(window.localStorage.getItem('grafana.featureToggles')).toBe('newDashboards=true');
    expect(screen.getByRole('button', { name: 'Apply and reload' })).toBeInTheDocument();
  });

  it('loads existing overrides and can reset them', async () => {
    window.localStorage.setItem('grafana.featureToggles', 'newDashboards=true,backendExperiment=false');

    const { user } = render(<FeatureTogglesPage />);

    expect(await screen.findByRole('switch', { name: 'Toggle newDashboards' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Reset overrides' }));
    await waitFor(() => expect(window.localStorage.getItem('grafana.featureToggles')).toBeNull());
  });
});
