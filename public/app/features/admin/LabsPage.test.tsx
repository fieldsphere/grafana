import { render, screen } from '@testing-library/react';

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

    expect(await screen.findByRole('heading', { name: /labs feature toggles/i })).toBeInTheDocument();
    expect(screen.getByText('panelTitleSearch')).toBeInTheDocument();
    expect(screen.getByText('storage')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
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

  it('shows error alert when request fails', async () => {
    const getMock = jest.fn().mockRejectedValue(new Error('boom'));
    getBackendSrvMock.mockReturnValue({
      get: getMock,
    } as unknown as ReturnType<typeof getBackendSrv>);

    render(<LabsPage />);
    expect(await screen.findByText('Unable to load feature toggles')).toBeInTheDocument();
  });
});
