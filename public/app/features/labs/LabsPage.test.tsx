import { render, screen, waitFor } from 'test/test-utils';

import LabsPage from './LabsPage';
import { getOpenFeatureToggles } from './api';

jest.mock('./api', () => ({
  getOpenFeatureToggles: jest.fn(),
}));

const mockGetOpenFeatureToggles = jest.mocked(getOpenFeatureToggles);

describe('LabsPage', () => {
  beforeEach(() => {
    mockGetOpenFeatureToggles.mockResolvedValue([
      {
        name: 'panelTitleSearch',
        description: 'Search for dashboards using panel title',
        stage: 'preview',
        enabled: true,
      },
      {
        name: 'lokiExperimentalStreaming',
        description: 'Support new streaming approach for loki',
        stage: 'experimental',
        enabled: false,
        requiresDevMode: false,
      },
    ]);
  });

  it('renders open feature flags', async () => {
    render(<LabsPage />);

    await waitFor(() => {
      expect(screen.getByText('panelTitleSearch')).toBeInTheDocument();
    });

    expect(screen.getByText('lokiExperimentalStreaming')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });
});
