import { render, screen } from '@testing-library/react';

import LabsPage from './LabsPage';
import { getAdminFeatureToggles, type AdminFeatureToggle } from './state/apis';

jest.mock('./state/apis', () => ({
  getAdminFeatureToggles: jest.fn(),
}));

const mockedGetFeatureToggles = jest.mocked(getAdminFeatureToggles);

describe('LabsPage', () => {
  it('renders feature flags and their states', async () => {
    const toggles: AdminFeatureToggle[] = [
      {
        name: 'alphaFeature',
        description: 'Alpha feature description',
        stage: 'experimental',
        expression: 'false',
        enabled: false,
        frontendOnly: true,
        requiresDevMode: false,
        requiresRestart: false,
      },
      {
        name: 'betaFeature',
        description: 'Beta feature description',
        stage: 'preview',
        expression: 'true',
        enabled: true,
        frontendOnly: false,
        requiresDevMode: true,
        requiresRestart: true,
      },
    ];

    mockedGetFeatureToggles.mockResolvedValue(toggles);

    render(<LabsPage />);

    expect(await screen.findByText('alphaFeature')).toBeInTheDocument();
    expect(screen.getByText('alphaFeature')).toBeInTheDocument();
    expect(screen.getByText('betaFeature')).toBeInTheDocument();
    expect(screen.getByText('Alpha feature description')).toBeInTheDocument();
    expect(screen.getByText('Beta feature description')).toBeInTheDocument();
    expect(screen.getByText('Frontend only')).toBeInTheDocument();
    expect(screen.getByText('Requires dev mode')).toBeInTheDocument();
    expect(screen.getByText('Requires restart')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search feature flags')).toBeInTheDocument();
  });
});
