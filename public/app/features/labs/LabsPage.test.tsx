import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/test-utils';

import LabsPage from './LabsPage';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({
    get: jest.fn().mockResolvedValue({
      toggles: [
        {
          name: 'fooFlag',
          description: 'Foo description',
          stage: 'experimental',
          enabled: true,
          expression: 'false',
          frontendOnly: false,
          requiresDevMode: false,
          requiresRestart: false,
        },
      ],
    }),
  }),
}));

describe('LabsPage', () => {
  it('loads and lists feature toggles from the API', async () => {
    render(<LabsPage />, {
      preloadedState: {
        navIndex: {
          labs: { id: 'labs', text: 'Labs', subTitle: 'Labs subtitle', url: '/labs' },
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('fooFlag')).toBeInTheDocument();
    });
    expect(screen.getByText('Foo description')).toBeInTheDocument();
  });
});
