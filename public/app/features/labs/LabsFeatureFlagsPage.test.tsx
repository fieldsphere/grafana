import { render, screen } from '@testing-library/react';
import { TestProvider } from 'test/helpers/TestProvider';

import { config } from '@grafana/runtime';

import LabsFeatureFlagsPage from './LabsFeatureFlagsPage';

describe('LabsFeatureFlagsPage', () => {
  const originalFeatureToggles = config.featureToggles;

  beforeEach(() => {
    config.bootData.navTree = [
      {
        text: 'Labs',
        id: 'labs',
        url: '/labs',
        children: [
          {
            text: 'Feature toggles',
            id: 'labs/feature-toggles',
            url: '/labs/feature-toggles',
          },
        ],
      },
    ];
  });

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('renders the feature toggles page with guidance text', () => {
    render(
      <TestProvider>
        <LabsFeatureFlagsPage />
      </TestProvider>
    );

    expect(
      screen.getByText(/This page shows the feature flags currently enabled in this Grafana instance/)
    ).toBeInTheDocument();
    expect(screen.getByText(/and restart Grafana\./)).toBeInTheDocument();
  });

  it('renders the feature toggles table', () => {
    (config.featureToggles as Record<string, boolean>) = {
      testFeature: true,
      anotherFeature: false,
    };

    render(
      <TestProvider>
        <LabsFeatureFlagsPage />
      </TestProvider>
    );

    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
    expect(screen.getByText('testFeature')).toBeInTheDocument();
    expect(screen.getByText('anotherFeature')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('shows empty state when no feature toggles are configured', () => {
    (config.featureToggles as Record<string, boolean>) = {};

    render(
      <TestProvider>
        <LabsFeatureFlagsPage />
      </TestProvider>
    );

    expect(
      screen.getByText(/No feature toggles are configured/)
    ).toBeInTheDocument();
  });
});
