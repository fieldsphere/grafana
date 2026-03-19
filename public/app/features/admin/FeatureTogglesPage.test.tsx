import { render, screen } from 'test/test-utils';

import { getBackendSrv } from '@grafana/runtime';

import FeatureTogglesPage from './FeatureTogglesPage';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: jest.fn(),
}));

describe('FeatureTogglesPage', () => {
  const get = jest.fn();

  beforeEach(() => {
    (getBackendSrv as jest.Mock).mockReturnValue({ get });
    get.mockResolvedValue({
      toggles: [
        {
          name: 'panelTitleSearch',
          description: 'Search for dashboards using panel title',
          stage: 'experimental',
          enabled: true,
        },
        {
          name: 'storage',
          description: 'Configurable storage for dashboards, datasources, and resources',
          stage: 'preview',
          enabled: false,
        },
      ],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders feature toggles and filters them', async () => {
    const { user } = render(<FeatureTogglesPage />, {
      preloadedState: {
        navIndex: {
          'server-settings': {
            id: 'server-settings',
            text: 'Settings',
            url: '/admin/settings',
          },
        },
      },
    });

    expect(await screen.findByRole('heading', { name: 'Labs feature toggles' })).toBeInTheDocument();
    expect(await screen.findByText('panelTitleSearch')).toBeInTheDocument();
    expect(screen.getByText('storage')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Filter by name, description, or stage'), 'storage');

    expect(screen.queryByText('panelTitleSearch')).not.toBeInTheDocument();
    expect(screen.getByText('storage')).toBeInTheDocument();
  });
});
