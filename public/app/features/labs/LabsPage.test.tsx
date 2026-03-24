import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/test-utils';

import { config, getBackendSrv } from '@grafana/runtime';

import LabsPage from './LabsPage';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: jest.fn(),
}));

describe('LabsPage', () => {
  const getMock = jest.fn();
  const navIndex = {
    labs: {
      id: 'labs',
      text: 'Labs',
      subTitle: 'Explore feature flags and experimental capabilities',
      icon: 'flask',
      url: '/labs',
    },
  };

  beforeEach(() => {
    jest.mocked(getBackendSrv).mockReturnValue({
      get: getMock,
    } as unknown as ReturnType<typeof getBackendSrv>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders feature flags and their statuses', async () => {
    config.bootData.navTree = [
      {
        id: 'labs',
        text: 'Labs',
        subTitle: 'Explore feature flags and experimental capabilities',
        icon: 'flask',
        url: '/labs',
      },
    ];

    getMock.mockResolvedValue({
      allowEditing: false,
      restartRequired: false,
      enabled: { alertRuleRestore: true },
      toggles: [
        {
          name: 'alertRuleRestore',
          description: 'Enables the alert rule restore feature',
          stage: 'preview',
          enabled: true,
          writeable: false,
        },
        {
          name: 'panelTitleSearch',
          description: 'Search for dashboards using panel title',
          stage: 'experimental',
          enabled: false,
          writeable: false,
        },
      ],
    });

    render(<LabsPage />, {
      preloadedState: { navIndex },
    });

    expect(await screen.findByRole('heading', { name: 'Labs' })).toBeInTheDocument();
    expect(await screen.findByText('alertRuleRestore')).toBeInTheDocument();
    expect(await screen.findByText('panelTitleSearch')).toBeInTheDocument();
    expect(await screen.findByText('Enabled')).toBeInTheDocument();
    expect(await screen.findByText('Disabled')).toBeInTheDocument();
  });

  it('filters flags by search term', async () => {
    config.bootData.navTree = [
      {
        id: 'labs',
        text: 'Labs',
        subTitle: 'Explore feature flags and experimental capabilities',
        icon: 'flask',
        url: '/labs',
      },
    ];

    getMock.mockResolvedValue({
      allowEditing: false,
      restartRequired: false,
      enabled: {},
      toggles: [
        {
          name: 'alertRuleRestore',
          description: 'Enables the alert rule restore feature',
          stage: 'preview',
          enabled: false,
          writeable: false,
        },
        {
          name: 'panelTitleSearch',
          description: 'Search for dashboards using panel title',
          stage: 'experimental',
          enabled: false,
          writeable: false,
        },
      ],
    });

    const { user } = render(<LabsPage />, {
      preloadedState: { navIndex },
    });

    await screen.findByText('alertRuleRestore');
    await user.type(screen.getByPlaceholderText('Search feature flags'), 'panel');

    await waitFor(() => {
      expect(screen.getByText('panelTitleSearch')).toBeInTheDocument();
      expect(screen.queryByText('alertRuleRestore')).not.toBeInTheDocument();
    });
  });
});
