import { render, screen, waitFor } from '@testing-library/react';

import { TestProvider } from 'test/helpers/TestProvider';

import LabsPage from './LabsPage';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({
    get: jest.fn().mockResolvedValue([
      {
        name: 'alphaFlag',
        description: 'Test flag',
        stage: 'experimental',
        expression: 'false',
        requiresDevMode: false,
        frontendOnly: false,
        hideFromDocs: false,
        requiresRestart: false,
        enabled: true,
      },
    ]),
  }),
}));

describe('LabsPage', () => {
  it('loads and renders feature flag rows', async () => {
    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('alphaFlag')).toBeInTheDocument();
    });
    expect(screen.getByText('Test flag')).toBeInTheDocument();
  });
});
