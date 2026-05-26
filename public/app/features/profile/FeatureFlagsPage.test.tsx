import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { render } from 'test/test-utils';

import { config, type BackendSrv, getBackendSrv, setBackendSrv } from '@grafana/runtime';

import FeatureFlagsPage from './FeatureFlagsPage';
import { FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY } from './featureFlagOverrides';

jest.mock('@grafana/data', () => ({
  ...jest.requireActual('@grafana/data'),
  featureToggleMeta: [
    {
      name: 'grafanaconThemes',
      description: 'Enables the temporary themes for GrafanaCon',
      stage: 'GA',
      owner: '@grafana/grafana-frontend-platform',
      defaultExpression: 'true',
      defaultValue: true,
      frontendOnly: false,
      requiresRestart: true,
      requiresDevMode: false,
      hideFromDocs: true,
    },
    {
      name: 'queryServiceFromUI',
      description: 'Routes requests to the new query service',
      stage: 'experimental',
      owner: '@grafana/grafana-datasources-core-services',
      defaultExpression: 'false',
      defaultValue: false,
      frontendOnly: true,
      requiresRestart: false,
      requiresDevMode: false,
      hideFromDocs: false,
    },
  ],
}));

describe('FeatureFlagsPage', () => {
  const originalBackendSrv = getBackendSrv();
  const originalFeatureToggles = config.featureToggles;
  const originalFeatureTogglesFromServer = config.featureTogglesFromServer;
  const originalNamespace = config.namespace;

  beforeEach(() => {
    window.localStorage.clear();
    config.featureToggles = {};
    config.featureTogglesFromServer = {
      grafanaconThemes: false,
      queryServiceFromUI: false,
    };
    config.namespace = 'default';
    setBackendSrv({
      post: jest.fn().mockResolvedValue({
        flags: [
          { key: 'grafanaconThemes', value: false },
          { key: 'queryServiceFromUI', value: false },
        ],
      }),
    } as unknown as BackendSrv);
  });

  afterEach(() => {
    window.localStorage.clear();
    config.featureToggles = originalFeatureToggles;
    config.featureTogglesFromServer = originalFeatureTogglesFromServer;
    config.namespace = originalNamespace;
    setBackendSrv(originalBackendSrv);
  });

  async function renderPage() {
    const result = render(<FeatureFlagsPage />);
    await waitFor(() => expect(screen.queryByText(/Loading current values/i)).not.toBeInTheDocument());
    return result;
  }

  it('lists registered feature flag metadata including grafanaconThemes', async () => {
    await renderPage();

    expect(screen.getByText('grafanaconThemes')).toBeInTheDocument();
    expect(screen.getByText('Enables the temporary themes for GrafanaCon')).toBeInTheDocument();
    expect(screen.getAllByText('Server/config')[0]).toBeInTheDocument();
  });

  it('filters flags by search query', async () => {
    await renderPage();

    fireEvent.change(screen.getByLabelText(/search feature flags/i), { target: { value: 'grafanaconThemes' } });

    expect(screen.getByText('grafanaconThemes')).toBeInTheDocument();
    expect(screen.queryByText('queryServiceFromUI')).not.toBeInTheDocument();
  });

  it('toggles a browser override and shows reload messaging', async () => {
    await renderPage();

    fireEvent.click(screen.getByTestId('feature-toggle-grafanaconThemes'));

    expect(window.localStorage.getItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY)).toBe('grafanaconThemes=true');
    expect(config.featureToggles.grafanaconThemes).toBe(true);
    expect(await screen.findByText('Feature flag override saved')).toBeInTheDocument();
    expect(screen.getByText('Browser override')).toBeInTheDocument();
  });

  it('resets an individual browser override', async () => {
    window.localStorage.setItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY, 'grafanaconThemes=true');

    await renderPage();

    const flagName = screen.getByText('grafanaconThemes');
    const row = within(flagName.closest('tr') as HTMLElement);
    fireEvent.click(row.getByRole('button', { name: /reset/i }));

    expect(window.localStorage.getItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY)).toBeNull();
    expect(config.featureToggles.grafanaconThemes).toBe(false);
  });

  it('resets all browser overrides', async () => {
    window.localStorage.setItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY, 'grafanaconThemes=true,queryServiceFromUI=true');

    await renderPage();

    fireEvent.click(screen.getByRole('button', { name: /reset all browser overrides/i }));

    expect(window.localStorage.getItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY)).toBeNull();
    expect(config.featureToggles.grafanaconThemes).toBe(false);
    expect(config.featureToggles.queryServiceFromUI).toBe(false);
  });

  it('falls back to registry defaults if loading server values fails', async () => {
    setBackendSrv({
      post: jest.fn().mockRejectedValue(new Error('network failed')),
    } as unknown as BackendSrv);

    await renderPage();

    expect(screen.getByText('grafanaconThemes')).toBeInTheDocument();
    expect(screen.getByText(/Could not load server feature flag values/i)).toBeInTheDocument();
  });
});
