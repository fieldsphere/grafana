import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/test-utils';

import { getBackendSrv } from '@grafana/runtime';

import LabsPage from './LabsPage';

jest.mock('@grafana/runtime', () => {
  const actual = jest.requireActual('@grafana/runtime');

  return {
    ...actual,
    getBackendSrv: jest.fn(),
  };
});

const getBackendSrvMock = getBackendSrv as jest.MockedFunction<typeof getBackendSrv>;

describe('LabsPage', () => {
  beforeEach(() => {
    getBackendSrvMock.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        toggles: [
          {
            name: 'dashgpt',
            description: 'Enable AI powered features in dashboards',
            stage: 'GA',
            enabled: true,
          },
          {
            name: 'panelTitleSearch',
            description: 'Search for dashboards using panel title',
            stage: 'preview',
            enabled: false,
          },
        ],
      }),
    } as unknown as ReturnType<typeof getBackendSrv>);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders feature flags returned by the Labs API', async () => {
    render(<LabsPage />);

    await waitFor(() => {
      expect(screen.getByText('dashgpt')).toBeInTheDocument();
    });

    expect(screen.getByText('panelTitleSearch')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByText('2 flags')).toBeInTheDocument();
  });

  it('filters feature flags by search query', async () => {
    const { user } = render(<LabsPage />);

    await waitFor(() => {
      expect(screen.getByText('dashgpt')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Filter flags by name, status, stage, or description'), 'disabled');

    expect(screen.queryByText('dashgpt')).not.toBeInTheDocument();
    expect(screen.getByText('panelTitleSearch')).toBeInTheDocument();
    expect(screen.getByText('1 flags')).toBeInTheDocument();
  });
});
