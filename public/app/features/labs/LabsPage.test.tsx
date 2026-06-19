import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProvider } from 'test/helpers/TestProvider';

import { locationService } from '@grafana/runtime';

import LabsPage from './LabsPage';

const getMock = jest.fn();

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({ get: getMock }),
}));

describe('LabsPage', () => {
  beforeEach(() => {
    locationService.push('/labs');
    getMock.mockReset();
  });

  it('renders feature toggles from the Labs API', async () => {
    getMock.mockResolvedValue({
      toggles: [
        {
          name: 'featureAlpha',
          description: 'Alpha toggle',
          stage: 'experimental',
          owner: '@grafana/example-squad',
          enabled: true,
          enabledByDefault: false,
          frontendOnly: true,
          requiresRestart: false,
          requiresDevMode: false,
          hideFromDocs: false,
        },
        {
          name: 'featureBeta',
          description: 'Beta toggle',
          stage: 'GA',
          owner: '@grafana/another-squad',
          enabled: false,
          enabledByDefault: true,
          frontendOnly: false,
          requiresRestart: true,
          requiresDevMode: true,
          hideFromDocs: true,
        },
      ],
    });

    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    expect(await screen.findByText('featureAlpha')).toBeInTheDocument();
    expect(screen.getByText('featureBeta')).toBeInTheDocument();
    expect(screen.getByText('Alpha toggle')).toBeInTheDocument();
    expect(screen.getByText('Beta toggle')).toBeInTheDocument();
    expect(screen.getByText('Frontend only')).toBeInTheDocument();
    expect(screen.getByText('Requires restart')).toBeInTheDocument();
  });

  it('filters feature toggles by the search query', async () => {
    getMock.mockResolvedValue({
      toggles: [
        {
          name: 'featureAlpha',
          description: 'Alpha toggle',
          stage: 'experimental',
          owner: '@grafana/example-squad',
          enabled: true,
          enabledByDefault: false,
          frontendOnly: false,
          requiresRestart: false,
          requiresDevMode: false,
          hideFromDocs: false,
        },
        {
          name: 'featureBeta',
          description: 'Beta toggle',
          stage: 'GA',
          owner: '@grafana/another-squad',
          enabled: false,
          enabledByDefault: true,
          frontendOnly: false,
          requiresRestart: false,
          requiresDevMode: false,
          hideFromDocs: false,
        },
      ],
    });

    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    await screen.findByText('featureAlpha');

    await userEvent.type(screen.getByPlaceholderText('Search feature flags'), 'beta');

    expect(screen.queryByText('featureAlpha')).not.toBeInTheDocument();
    expect(screen.getByText('featureBeta')).toBeInTheDocument();
  });
});
