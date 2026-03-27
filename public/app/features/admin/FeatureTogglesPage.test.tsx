import { render, screen } from 'test/test-utils';

import FeatureTogglesPage from './FeatureTogglesPage';
import { FeatureFlag, getFeatureFlags } from './state/apis';

jest.mock('./state/apis', () => ({
  getFeatureFlags: jest.fn(),
}));

const mockedGetFeatureFlags = jest.mocked(getFeatureFlags);

describe('FeatureTogglesPage', () => {
  it('renders flags from the API and filters them by query', async () => {
    const flags: FeatureFlag[] = [
      {
        name: 'alphaFlag',
        description: 'Alpha capability',
        stage: 'experimental',
        expression: '',
        enabled: false,
        frontendOnly: true,
        requiresDevMode: true,
        requiresRestart: false,
      },
      {
        name: 'betaFlag',
        description: 'Beta capability',
        stage: 'preview',
        expression: 'true',
        enabled: true,
        frontendOnly: false,
        requiresDevMode: false,
        requiresRestart: true,
      },
    ];

    mockedGetFeatureFlags.mockResolvedValue(flags);

    const { user } = render(<FeatureTogglesPage />);

    expect(await screen.findByRole('heading', { name: /feature toggles/i })).toBeInTheDocument();
    expect(screen.getByText('alphaFlag')).toBeInTheDocument();
    expect(screen.getByText('betaFlag')).toBeInTheDocument();
    expect(screen.getByText('2 flags')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/search by flag name, stage, description, or status/i), 'enabled');

    expect(screen.queryByText('alphaFlag')).not.toBeInTheDocument();
    expect(screen.getByText('betaFlag')).toBeInTheDocument();
    expect(screen.getByText('1 flags')).toBeInTheDocument();
  });
});
