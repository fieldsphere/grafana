import { screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import { type FeatureToggles } from '@grafana/data';
import config from 'app/core/config';

import LabsPage, { getEnabledFeatureFlags } from './LabsPage';

describe('LabsPage', () => {
  const originalFeatureToggles = { ...config.featureToggles };

  afterEach(() => {
    config.featureToggles = { ...originalFeatureToggles };
  });

  it('lists only enabled feature flags sorted alphabetically', () => {
    const flags = getEnabledFeatureFlags({
      dashboardNewLayouts: true,
      alertingListViewV2: true,
      featureHighlights: false,
    });

    expect(flags.map((flag) => flag.name)).toEqual(['alertingListViewV2', 'dashboardNewLayouts']);
  });

  it('renders enabled feature flags on the page', async () => {
    config.featureToggles = {
      dashboardNewLayouts: true,
      alertingListViewV2: true,
      featureHighlights: false,
    } satisfies FeatureToggles;

    render(<LabsPage />, {
      preloadedState: {
        navIndex: {
          labs: {
            id: 'labs',
            text: 'Labs',
            subTitle: 'Explore experimental features and enabled feature flags',
            url: '/labs',
          },
        },
      },
    });

    expect(await screen.findByText('Feature flags')).toBeInTheDocument();
    expect(screen.getByText('alertingListViewV2')).toBeInTheDocument();
    expect(screen.getByText('dashboardNewLayouts')).toBeInTheDocument();
    expect(screen.queryByText('featureHighlights')).not.toBeInTheDocument();
  });

  it('filters feature flags by search query', async () => {
    config.featureToggles = {
      dashboardNewLayouts: true,
      alertingListViewV2: true,
    } satisfies FeatureToggles;

    const { user } = render(<LabsPage />, {
      preloadedState: {
        navIndex: {
          labs: {
            id: 'labs',
            text: 'Labs',
            subTitle: 'Explore experimental features and enabled feature flags',
            url: '/labs',
          },
        },
      },
    });

    await user.type(await screen.findByPlaceholderText(/search feature flags/i), 'dashboard');

    expect(screen.getByText('dashboardNewLayouts')).toBeInTheDocument();
    expect(screen.queryByText('alertingListViewV2')).not.toBeInTheDocument();
  });
});
