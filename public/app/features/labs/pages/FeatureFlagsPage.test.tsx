import { render, screen } from 'test/test-utils';

import { configureStore } from 'app/store/configureStore';

import FeatureFlagsPage from './FeatureFlagsPage';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({
    get: jest.fn().mockResolvedValue({
      allowEditing: false,
      restartRequired: false,
      enabled: { fooFlag: true },
      toggles: [
        {
          name: 'fooFlag',
          stage: 'experimental',
          enabled: true,
          writeable: false,
        },
      ],
    }),
  }),
}));

describe('FeatureFlagsPage', () => {
  it('renders read-only messaging and disabled switches', async () => {
    const store = configureStore({
      navIndex: {
        'labs/feature-flags': {
          id: 'labs/feature-flags',
          text: 'Feature flags',
          url: '/labs/feature-flags',
        },
      },
    });

    render(<FeatureFlagsPage />, { store });

    expect(await screen.findByText(/Read-only view/i)).toBeInTheDocument();
    expect(await screen.findByRole('switch', { name: /Toggle fooFlag/i })).toBeDisabled();
  });
});
