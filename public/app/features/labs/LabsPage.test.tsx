import { render, screen } from 'test/test-utils';

import LabsPage from './LabsPage';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({
    get: jest.fn().mockResolvedValue({
      flags: [
        {
          name: 'panelTitleSearch',
          stage: 'experimental',
          enabled: true,
          description: 'Example flag',
        },
      ],
    }),
  }),
}));

describe('LabsPage', () => {
  it('renders the feature flag catalog', async () => {
    render(<LabsPage />);

    expect(await screen.findByText('panelTitleSearch')).toBeInTheDocument();
    expect(screen.getByText('Example flag')).toBeInTheDocument();
  });
});
