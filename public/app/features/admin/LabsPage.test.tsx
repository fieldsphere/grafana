import { render, screen } from 'test/test-utils';

import { getBackendSrv } from '@grafana/runtime';

import LabsPage from './LabsPage';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: jest.fn(),
}));

const getBackendSrvMock = jest.mocked(getBackendSrv);

describe('LabsPage', () => {
  beforeEach(() => {
    getBackendSrvMock.mockReset();
  });

  it('renders feature toggles including enabled state', async () => {
    const getMock = jest.fn().mockResolvedValue({
      featureToggles: [
        {
          name: 'panelTitleSearch',
          description: 'Search for dashboards using panel title',
          stage: 'preview',
          frontendOnly: true,
          requiresRestart: false,
          enabled: true,
        },
        {
          name: 'storage',
          description: 'Configurable storage for dashboards',
          stage: 'experimental',
          frontendOnly: false,
          requiresRestart: true,
          enabled: false,
        },
      ],
    });
    getBackendSrvMock.mockReturnValue({
      get: getMock,
    } as unknown as ReturnType<typeof getBackendSrv>);

    render(<LabsPage />);

    expect(await screen.findByText('Labs feature toggles')).toBeInTheDocument();
    expect(await screen.findByText('panelTitleSearch')).toBeInTheDocument();
    expect(await screen.findByText('storage')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Enabled' })).toBeInTheDocument();
    expect(screen.getAllByText('Enabled').length).toBeGreaterThan(1);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledWith('api/admin/features');
  });

  it('shows empty state when no toggles are returned', async () => {
    const getMock = jest.fn().mockResolvedValue({ featureToggles: [] });
    getBackendSrvMock.mockReturnValue({
      get: getMock,
    } as unknown as ReturnType<typeof getBackendSrv>);

    render(<LabsPage />);
    expect(await screen.findByText('No feature toggles found')).toBeInTheDocument();
  });

  it('falls back to empty state when request fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const getMock = jest.fn().mockRejectedValue(new Error('boom'));
    getBackendSrvMock.mockReturnValue({
      get: getMock,
    } as unknown as ReturnType<typeof getBackendSrv>);

    render(<LabsPage />);
    expect(await screen.findByText('No feature toggles found')).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
