import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import { getBackendSrv } from '@grafana/runtime';

import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

import LabsFeatureTogglesPage from './LabsFeatureTogglesPage';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: jest.fn(),
}));

jest.mock('app/core/services/context_srv', () => ({
  contextSrv: {
    user: { isGrafanaAdmin: true },
    hasPermission: jest.fn(),
    evaluatePermission: jest.fn(),
  },
}));

describe('LabsFeatureTogglesPage', () => {
  const get = jest.fn();
  const put = jest.fn();
  const del = jest.fn();

  beforeEach(() => {
    (getBackendSrv as jest.Mock).mockReturnValue({ get, put, delete: del });
    (contextSrv.hasPermission as jest.Mock).mockImplementation((action: string) => {
      return (
        action === AccessControlAction.FeatureManagementRead || action === AccessControlAction.FeatureManagementWrite
      );
    });
    get.mockResolvedValue([
      {
        name: 'fooFlag',
        description: 'A test flag',
        stage: 'experimental',
        frontendOnly: false,
        requiresRestart: false,
        requiresDevMode: false,
        enabled: false,
        source: 'default',
        writable: true,
        meetsRuntime: true,
      },
    ]);
    put.mockResolvedValue({});
    del.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads and filters flags', async () => {
    render(<LabsFeatureTogglesPage />);

    await waitFor(() => expect(get).toHaveBeenCalledWith('/api/admin/labs/feature-toggles'));
    expect(await screen.findByText('fooFlag')).toBeInTheDocument();

    const search = screen.getByPlaceholderText('Filter by name, description, or stage');
    await userEvent.type(search, 'nomatch');
    expect(screen.queryByText('fooFlag')).not.toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, 'foo');
    expect(await screen.findByText('fooFlag')).toBeInTheDocument();
  });

  it('toggles a flag when writable', async () => {
    render(<LabsFeatureTogglesPage />);

    const toggle = await screen.findByRole('switch');
    await userEvent.click(toggle);

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/api/admin/labs/feature-toggles/fooFlag', { enabled: true })
    );
  });
});
