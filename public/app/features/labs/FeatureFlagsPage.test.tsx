import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import { setBackendSrv } from '@grafana/runtime';
import { configureStore } from 'app/store/configureStore';

import FeatureFlagsPage from './FeatureFlagsPage';

const mockState = {
  allowEditing: false,
  enabled: {
    enabledFeature: true,
  },
  toggles: [
    {
      name: 'disabledFeature',
      description: 'A disabled experimental feature',
      stage: 'experimental',
      enabled: false,
      writeable: false,
      source: { kind: 'FeatureToggleDefault', name: 'default' },
    },
    {
      name: 'enabledFeature',
      description: 'An enabled feature from config',
      stage: 'preview',
      enabled: true,
      writeable: false,
      source: { kind: 'ConfigMap', name: 'grafana.ini', fieldPath: 'feature_toggles.enabledFeature' },
    },
  ],
};

function renderPage() {
  const store = configureStore({
    navIndex: {
      'labs-feature-flags': {
        id: 'labs-feature-flags',
        text: 'Feature flags',
        url: '/labs/feature-flags',
      },
    },
  });

  return render(<FeatureFlagsPage />, { store });
}

describe('FeatureFlagsPage', () => {
  beforeEach(() => {
    setBackendSrv({
      get: jest.fn().mockResolvedValue(mockState),
    } as never);
  });

  it('renders feature flag state from the backend', async () => {
    renderPage();

    expect(await screen.findByText('enabledFeature')).toBeVisible();
    expect(screen.getByText('disabledFeature')).toBeVisible();
    expect(screen.getByText('An enabled feature from config')).toBeVisible();
    expect(screen.getByText('feature_toggles.enabledFeature')).toBeVisible();
    expect(screen.getAllByText('Enabled')).toHaveLength(1);
    expect(screen.getAllByText('Disabled')).toHaveLength(1);
    expect(screen.getByText('Showing 2 of 2 flags')).toBeVisible();
  });

  it('filters feature flags by query', async () => {
    renderPage();

    await screen.findByText('enabledFeature');
    await userEvent.type(screen.getByPlaceholderText('Filter by name, stage, source, or description'), 'disabled');

    expect(screen.getByText('disabledFeature')).toBeVisible();
    expect(screen.queryByText('enabledFeature')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 2 flags')).toBeVisible();
  });
});
