import { screen } from '@testing-library/react';

import { config } from '@grafana/runtime';
import { render } from 'test/test-utils';

import { navIndex } from '../connections/mocks/store.navIndex.mock';

import LabsPage from './LabsPage';

describe('LabsPage', () => {
  const originalFeatureToggleList = config.featureToggleList;

  beforeEach(() => {
    config.featureToggleList = [
      {
        name: 'alphaFeature',
        description: 'Alpha feature description',
        stage: 'experimental',
        enabled: false,
      },
      {
        name: 'betaFeature',
        description: 'Beta feature description',
        stage: 'preview',
        enabled: true,
      },
    ];
  });

  afterEach(() => {
    config.featureToggleList = originalFeatureToggleList;
  });

  it('renders all feature toggles and their statuses', () => {
    render(<LabsPage />, {
      preloadedState: { navIndex },
    });

    expect(screen.getByRole('heading', { name: 'Labs' })).toBeInTheDocument();
    expect(screen.getByText('alphaFeature')).toBeInTheDocument();
    expect(screen.getByText('betaFeature')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Experimental')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('filters feature toggles by search query', async () => {
    const { user } = render(<LabsPage />, {
      preloadedState: { navIndex },
    });

    await user.type(screen.getByPlaceholderText('Search feature flags'), 'beta');

    expect(screen.queryByText('alphaFeature')).not.toBeInTheDocument();
    expect(screen.getByText('betaFeature')).toBeInTheDocument();
  });

  it('shows an empty state when the search has no matches', async () => {
    const { user } = render(<LabsPage />, {
      preloadedState: { navIndex },
    });

    await user.type(screen.getByPlaceholderText('Search feature flags'), 'missing');

    expect(screen.getByText('No feature flags found')).toBeInTheDocument();
  });
});
