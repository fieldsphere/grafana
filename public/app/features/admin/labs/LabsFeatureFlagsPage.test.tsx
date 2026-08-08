import { render, screen } from '@testing-library/react';
import { TestProvider } from 'test/helpers/TestProvider';

import { type BackendSrv, setBackendSrv } from '@grafana/runtime';

import { LabsFeatureFlagsPage } from './LabsFeatureFlagsPage';

const backendSrv = {
  get: jest.fn(),
} as unknown as BackendSrv;

setBackendSrv(backendSrv);

describe('LabsFeatureFlagsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders feature flags and limitations from API response', async () => {
    (backendSrv.get as jest.Mock).mockResolvedValue({
      runtimeTogglingSupported: false,
      message: 'Feature flags are currently read-only in the UI.',
      flags: [
        {
          name: 'featureHighlights',
          description: 'Highlight Grafana Enterprise features',
          stage: 'GA',
          enabled: true,
          frontendOnly: false,
          requiresRestart: true,
          runtimeEditable: false,
          configured: true,
          source: 'configured',
        },
      ],
    });

    render(<LabsFeatureFlagsPage />, { wrapper: TestProvider });

    expect(await screen.findByText('featureHighlights')).toBeInTheDocument();
    expect(screen.getByText('Highlight Grafana Enterprise features')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Restart required')).toBeInTheDocument();
    expect(screen.getByText('Server managed')).toBeInTheDocument();
    expect(screen.getByText('configured')).toBeInTheDocument();
    expect(screen.getByText('Feature flags are currently read-only in the UI.')).toBeInTheDocument();
  });

  it('renders empty state when API returns no flags', async () => {
    (backendSrv.get as jest.Mock).mockResolvedValue({
      runtimeTogglingSupported: false,
      message: 'No flags available',
      flags: [],
    });

    render(<LabsFeatureFlagsPage />, { wrapper: TestProvider });

    expect(await screen.findByText('No feature flags are available for this instance')).toBeInTheDocument();
  });
});
