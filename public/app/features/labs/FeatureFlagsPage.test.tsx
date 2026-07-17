import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getBackendSrv } from '@grafana/runtime';

import { TestProvider } from '../../../test/helpers/TestProvider';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

import FeatureFlagsPage from './FeatureFlagsPage';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: jest.fn(),
}));

const mockGetBackendSrv = jest.mocked(getBackendSrv);

const resolvedState = {
  allowEditing: true,
  restartRequired: false,
  enabled: { alphaFlag: true },
  toggles: [
    {
      name: 'alphaFlag',
      description: 'Alpha feature',
      stage: 'experimental',
      enabled: true,
      writeable: true,
      source: { name: 'database' },
    },
    {
      name: 'lockedFlag',
      description: 'Locked feature',
      stage: 'preview',
      enabled: false,
      writeable: false,
      source: { name: 'config' },
      warning: 'Locked by configuration',
    },
  ],
};

const renderPage = () => {
  render(
    <TestProvider>
      <FeatureFlagsPage />
    </TestProvider>
  );
};

describe('FeatureFlagsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    contextSrv.user.permissions = {
      [AccessControlAction.FeatureManagementRead]: true,
      [AccessControlAction.FeatureManagementWrite]: true,
    };

    mockGetBackendSrv.mockReturnValue({
      get: jest.fn().mockResolvedValue(resolvedState),
      post: jest.fn().mockResolvedValue({ message: 'Feature flag updated' }),
      delete: jest.fn().mockResolvedValue({ message: 'Feature flag reset' }),
    } as unknown as ReturnType<typeof getBackendSrv>);
  });

  it('renders feature flags from the resolved API', async () => {
    renderPage();

    expect(await screen.findByText('alphaFlag')).toBeInTheDocument();
    expect(screen.getByText('lockedFlag')).toBeInTheDocument();
    expect(screen.getByText('Locked by configuration')).toBeInTheDocument();
  });

  it('shows confirmation before toggling experimental flags', async () => {
    const user = userEvent.setup();
    renderPage();

    const switches = await screen.findAllByRole('switch');
    await user.click(switches[0]);

    expect(await screen.findByText('Enable experimental feature?')).toBeInTheDocument();
  });

  it('shows read-only notice without write permission', async () => {
    contextSrv.user.permissions = {
      [AccessControlAction.FeatureManagementRead]: true,
    };

    renderPage();

    expect(await screen.findByText('Read-only access')).toBeInTheDocument();
  });

  it('posts updates after confirmation', async () => {
    const user = userEvent.setup();
    const backend = mockGetBackendSrv();
    renderPage();

    const switches = await screen.findAllByRole('switch');
    await user.click(switches[0]);
    await user.click(await screen.findByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(backend.post).toHaveBeenCalledWith('/api/admin/feature-toggles', {
        name: 'alphaFlag',
        enabled: false,
      });
    });
  });
});
