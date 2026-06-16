import { render, screen } from '@testing-library/react';
import FeatureTogglesPage from './FeatureTogglesPage';
import { type FeatureToggleState } from './api';

jest.mock('app/core/components/Page/Page', () => {
  const Page = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  Page.Contents = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  return { Page };
});

const mockState: FeatureToggleState = {
  allowEditing: true,
  restartRequired: true,
  toggles: [
    {
      name: 'panelTitleSearch',
      description: 'Search for dashboards using panel title',
      stage: 'preview',
      enabled: false,
      writeable: true,
      source: { kind: 'default' },
    },
    {
      name: 'live.runAPIServer',
      description: 'Registers a live apiserver',
      stage: 'experimental',
      enabled: false,
      writeable: true,
      requiresRestart: true,
      pendingEnabled: true,
      source: { kind: 'override' },
    },
    {
      name: 'cloudWatchCrossAccountQuerying',
      description: 'Configured in grafana.ini',
      stage: 'GA',
      enabled: true,
      writeable: false,
      source: { kind: 'configured' },
    },
  ],
};

jest.mock('./api', () => ({
  getFeatureToggles: jest.fn(async () => mockState),
  setFeatureToggle: jest.fn(async () => mockState),
  clearFeatureToggleOverride: jest.fn(async () => mockState),
}));

jest.mock('app/core/services/context_srv', () => ({
  contextSrv: {
    hasPermission: () => true,
  },
}));

describe('FeatureTogglesPage', () => {
  it('renders the lab header and team flags by default', async () => {
    render(<FeatureTogglesPage />);

    expect(await screen.findByRole('heading', { name: /feature flag lab/i })).toBeInTheDocument();
    expect(await screen.findByTestId('feature-flag-row-panelTitleSearch')).toBeInTheDocument();
    expect(screen.getByTestId('feature-flag-row-live.runAPIServer')).toBeInTheDocument();
    expect(screen.queryByTestId('feature-flag-row-cloudWatchCrossAccountQuerying')).not.toBeInTheDocument();
    expect(screen.getByText(/restart required/i)).toBeInTheDocument();
  });
});
