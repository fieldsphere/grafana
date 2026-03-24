import { screen } from '@testing-library/react';

import { getBackendSrv } from '@grafana/runtime';
import { render } from 'test/test-utils';

import LabsPage from './LabsPage';
import { type ResolvedToggleState } from './types';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: jest.fn(),
}));

const mockGet = jest.fn();

describe('LabsPage', () => {
  beforeEach(() => {
    mockGet.mockReset();
    jest.mocked(getBackendSrv).mockReturnValue({
      get: mockGet,
    } as unknown as ReturnType<typeof getBackendSrv>);
  });

  it('renders feature toggle statuses', async () => {
    const response: ResolvedToggleState = {
      allowEditing: false,
      restartRequired: true,
      enabled: { dashboardScene: true },
      toggles: [
        {
          name: 'dashboardScene',
          description: 'Use the new dashboard scenes experience',
          stage: 'preview',
          enabled: true,
          writeable: false,
        },
        {
          name: 'oldFeature',
          description: '',
          stage: 'deprecated',
          enabled: false,
          writeable: false,
        },
      ],
    };

    mockGet.mockResolvedValue(response);

    render(<LabsPage />);

    expect(await screen.findByText('dashboardScene')).toBeInTheDocument();
    expect(screen.getByText('oldFeature')).toBeInTheDocument();
    expect(screen.getByText('Restart required')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByText('No description provided')).toBeInTheDocument();
  });

  it('renders an error state when loading fails', async () => {
    mockGet.mockRejectedValue(new Error('boom'));

    render(<LabsPage />);

    expect(await screen.findByText('Failed to load feature flags')).toBeInTheDocument();
  });
});
