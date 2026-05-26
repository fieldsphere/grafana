import { screen, waitFor, within } from '@testing-library/react';
import { render } from 'test/test-utils';

import { config, type BackendSrv, getBackendSrv, setBackendSrv } from '@grafana/runtime';

import FeatureFlagsPage from './FeatureFlagsPage';
import { FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY } from './featureFlagOverrides';

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

  it('lists registered feature flag metadata including grafanaconThemes', async () => {
    render(<FeatureFlagsPage />);

    expect(await screen.findByText('grafanaconThemes')).toBeInTheDocument();
    expect(screen.getByText('Enables the temporary themes for GrafanaCon')).toBeInTheDocument();
    expect(screen.getAllByText('Server/config')[0]).toBeInTheDocument();
  });

  it('filters flags by search query', async () => {
    const { user } = render(<FeatureFlagsPage />);

    await user.type(screen.getByRole('textbox', { name: /search feature flags/i }), 'grafanaconThemes');

    expect(screen.getByText('grafanaconThemes')).toBeInTheDocument();
    expect(screen.queryByText('queryServiceFromUI')).not.toBeInTheDocument();
  });

  it('toggles a browser override and shows reload messaging', async () => {
    const { user } = render(<FeatureFlagsPage />);

    await user.click(await screen.findByLabelText('Toggle grafanaconThemes'));

    expect(window.localStorage.getItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY)).toBe('grafanaconThemes=true');
    expect(config.featureToggles.grafanaconThemes).toBe(true);
    expect(await screen.findByText('Feature flag override saved')).toBeInTheDocument();
    expect(screen.getByText('Browser override')).toBeInTheDocument();
  });

  it('resets an individual browser override', async () => {
    window.localStorage.setItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY, 'grafanaconThemes=true');

    const { user } = render(<FeatureFlagsPage />);

    const flagName = await screen.findByText('grafanaconThemes');
    const row = within(flagName.closest('tr') as HTMLElement);
    await user.click(row.getByRole('button', { name: /reset/i }));

    expect(window.localStorage.getItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY)).toBeNull();
    expect(config.featureToggles.grafanaconThemes).toBe(false);
  });

  it('resets all browser overrides', async () => {
    window.localStorage.setItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY, 'grafanaconThemes=true,queryServiceFromUI=true');

    const { user } = render(<FeatureFlagsPage />);

    await user.click(screen.getByRole('button', { name: /reset all browser overrides/i }));

    expect(window.localStorage.getItem(FEATURE_TOGGLE_OVERRIDES_STORAGE_KEY)).toBeNull();
    expect(config.featureToggles.grafanaconThemes).toBe(false);
    expect(config.featureToggles.queryServiceFromUI).toBe(false);
  });

  it('falls back to registry defaults if loading server values fails', async () => {
    setBackendSrv({
      post: jest.fn().mockRejectedValue(new Error('network failed')),
    } as unknown as BackendSrv);

    render(<FeatureFlagsPage />);

    expect(await screen.findByText('grafanaconThemes')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Could not load server feature flag values/i)).toBeInTheDocument());
  });
});
