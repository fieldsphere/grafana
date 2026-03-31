import { render, screen } from '@testing-library/react';

import { TestProvider } from 'test/helpers/TestProvider';

import LabsPage from './LabsPage';
import { getFeatureToggles } from './labsApi';

jest.mock('./labsApi', () => ({
  getFeatureToggles: jest.fn(),
}));

const mockGetFeatureToggles = jest.mocked(getFeatureToggles);

describe('LabsPage', () => {
  it('renders enabled and disabled feature flags', async () => {
    mockGetFeatureToggles.mockResolvedValue({
      enabled: { dashboardScene: true },
      toggles: [
        {
          name: 'dashboardScene',
          description: 'Enables dashboard rendering using scenes for all roles',
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
    });

    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    expect(await screen.findByText('Labs feature flags')).toBeInTheDocument();
    expect(screen.getByText('Feature flag')).toBeInTheDocument();
    expect(screen.getByText('Stage')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 2 flags')).toBeInTheDocument();
    expect(screen.getByText('Review all Grafana feature flags and whether they are currently enabled.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Filter feature flags')).toBeInTheDocument();
  });
});
