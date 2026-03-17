import { screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import LabsPage from './LabsPage';

const mockGet = jest.fn();

jest.mock('@grafana/runtime', () => {
  const original = jest.requireActual('@grafana/runtime');

  return {
    ...original,
    getBackendSrv: () => ({
      get: mockGet,
    }),
  };
});

describe('LabsPage', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('renders feature toggles returned by the API', async () => {
    mockGet.mockResolvedValue({
      toggles: [
        {
          name: 'alphaFlag',
          description: 'Alpha feature',
          stage: 'experimental',
          enabled: false,
          frontendOnly: true,
          requiresRestart: false,
        },
        {
          name: 'gaFlag',
          description: 'Generally available feature',
          stage: 'GA',
          enabled: true,
          frontendOnly: false,
          requiresRestart: true,
        },
      ],
    });

    render(<LabsPage />);

    expect(await screen.findByText('alphaFlag')).toBeInTheDocument();
    expect(await screen.findByText('gaFlag')).toBeInTheDocument();
    expect(screen.getByText('Alpha feature')).toBeInTheDocument();
    expect(screen.getByText('Generally available feature')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByText('Frontend only')).toBeInTheDocument();
    expect(screen.getByText('Requires restart')).toBeInTheDocument();
  });

  it('renders an error message when the API request fails', async () => {
    mockGet.mockRejectedValue(new Error('boom'));

    render(<LabsPage />);

    expect(await screen.findByText('Failed to load feature flags')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
});
