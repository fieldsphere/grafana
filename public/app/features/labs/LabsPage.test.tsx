import { render, screen } from 'test/test-utils';

import { config } from '@grafana/runtime';

import { LabsPage } from './LabsPage';

const labsNavItem = {
  id: 'labs',
  text: 'Labs',
  url: '/labs',
  subTitle: 'Explore experimental features and enabled feature flags',
};

describe('LabsPage', () => {
  const originalFeatureToggles = config.featureToggles;

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('lists enabled feature flags', async () => {
    config.featureToggles = {
      dashboardScene: true,
      nestedFolders: true,
      disabledFlag: false,
    } as typeof config.featureToggles;

    render(<LabsPage />, { preloadedState: { navIndex: { labs: labsNavItem } } });

    expect(await screen.findByRole('heading', { name: 'Labs' })).toBeInTheDocument();
    expect(screen.getByText('dashboardScene')).toBeInTheDocument();
    expect(screen.getByText('nestedFolders')).toBeInTheDocument();
    expect(screen.queryByText('disabledFlag')).not.toBeInTheDocument();
  });

  it('shows an empty state when no feature flags are enabled', async () => {
    config.featureToggles = {} as typeof config.featureToggles;

    render(<LabsPage />, { preloadedState: { navIndex: { labs: labsNavItem } } });

    expect(await screen.findByText('No feature flags are currently enabled')).toBeInTheDocument();
  });

  it('filters feature flags by search query', async () => {
    config.featureToggles = {
      dashboardScene: true,
      nestedFolders: true,
      alertingSimplifiedRouting: true,
    } as typeof config.featureToggles;

    const { user } = render(<LabsPage />, { preloadedState: { navIndex: { labs: labsNavItem } } });

    await user.type(screen.getByPlaceholderText('Search feature flags'), 'nested');

    expect(screen.getByText('nestedFolders')).toBeInTheDocument();
    expect(screen.queryByText('dashboardScene')).not.toBeInTheDocument();
    expect(screen.queryByText('alertingSimplifiedRouting')).not.toBeInTheDocument();
  });
});
