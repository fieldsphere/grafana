import { render, screen } from 'test/test-utils';

import { config } from '@grafana/runtime';

import LabsPage from './LabsPage';

const labsNav = {
  id: 'labs',
  text: 'Labs',
  subTitle: 'Explore experimental features enabled in your Grafana instance',
  url: '/labs',
};

function renderLabsPage() {
  return render(<LabsPage />, {
    preloadedState: {
      navIndex: {
        labs: labsNav,
      },
    },
  });
}

describe('LabsPage', () => {
  const originalFeatureToggles = config.featureToggles;

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('renders enabled feature flags', () => {
    config.featureToggles = {
      ...originalFeatureToggles,
      alertingTriage: true,
      featureHighlights: false,
      awsAsyncQueryCaching: true,
    };

    renderLabsPage();

    expect(screen.getAllByRole('heading', { name: 'Labs' })).toHaveLength(1);
    expect(screen.getByText('alertingTriage')).toBeInTheDocument();
    expect(screen.getByText('awsAsyncQueryCaching')).toBeInTheDocument();
    expect(screen.queryByText('featureHighlights')).not.toBeInTheDocument();
  });

  it('shows empty state when no feature flags are enabled', () => {
    config.featureToggles = Object.fromEntries(
      Object.keys(originalFeatureToggles).map((key) => [key, false])
    ) as typeof config.featureToggles;

    renderLabsPage();

    expect(screen.getByText('No feature flags are currently enabled.')).toBeInTheDocument();
  });
});
