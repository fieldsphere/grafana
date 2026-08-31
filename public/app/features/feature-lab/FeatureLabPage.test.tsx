import { render, screen, waitFor } from '@testing-library/react';
import { TestProvider } from 'test/helpers/TestProvider';

import { setBackendSrv } from '@grafana/runtime';

import FeatureLabPage from './FeatureLabPage';

const mockFlags = [
  { name: 'featureA', description: 'First feature', enabled: true, stage: 'GA' },
  { name: 'featureB', description: 'Second feature', enabled: false, stage: 'preview' },
  { name: 'featureC', description: 'Third feature', enabled: true, stage: 'experimental' },
];

const mockBackendSrv = {
  get: jest.fn().mockResolvedValue(mockFlags),
  put: jest.fn().mockResolvedValue({}),
} as any;

describe('FeatureLabPage', () => {
  beforeEach(() => {
    setBackendSrv(mockBackendSrv);
  });

  it('renders feature flags table', async () => {
    render(
      <TestProvider>
        <FeatureLabPage />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('featureA')).toBeInTheDocument();
    });

    expect(screen.getByText('featureB')).toBeInTheDocument();
    expect(screen.getByText('featureC')).toBeInTheDocument();
    expect(screen.getByText('First feature')).toBeInTheDocument();
    expect(screen.getByText('Second feature')).toBeInTheDocument();
  });

  it('displays info alert about runtime-only changes', async () => {
    render(
      <TestProvider>
        <FeatureLabPage />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/runtime only/i)).toBeInTheDocument();
    });
  });

  it('renders search input', async () => {
    render(
      <TestProvider>
        <FeatureLabPage />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search feature flags...')).toBeInTheDocument();
    });
  });
});
