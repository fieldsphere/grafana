import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import { config } from '@grafana/runtime';
import { getLocalStorageProvider } from '@grafana/runtime/internal';
import { configureStore } from 'app/store/configureStore';

import LabsPage from './LabsPage';

const getStorageKey = (flagName: string) => `grafana.openfeature.${flagName}`;

const renderPage = () => {
  const store = configureStore({
    navIndex: {
      labs: {
        id: 'labs',
        text: 'Labs',
        url: '/labs',
      },
    },
  });

  return render(<LabsPage />, { store });
};

describe('LabsPage', () => {
  const originalFeatureToggles = config.featureToggles;

  beforeEach(() => {
    window.localStorage.clear();
    getLocalStorageProvider().clearFlags();
    config.featureToggles = {
      featureHighlights: true,
      lokiQuerySplitting: true,
      panelTitleSearch: false,
    };
  });

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('lists enabled feature flags from boot config', () => {
    renderPage();

    expect(screen.getByText('featureHighlights')).toBeInTheDocument();
    expect(screen.getByText('lokiQuerySplitting')).toBeInTheDocument();
    expect(screen.queryByText('panelTitleSearch')).not.toBeInTheDocument();
  });

  it('stores local overrides when a feature flag is toggled', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('switch', { name: 'Toggle featureHighlights' }));

    await waitFor(() => {
      expect(window.localStorage.getItem(getStorageKey('featureHighlights'))).toBe('false');
    });
    expect(await screen.findByText('Override')).toBeInTheDocument();
  });

  it('resets local overrides', async () => {
    getLocalStorageProvider().setFlags({ featureHighlights: false });

    renderPage();

    await userEvent.click(screen.getAllByRole('button', { name: 'Reset' })[0]);

    await waitFor(() => {
      expect(window.localStorage.getItem(getStorageKey('featureHighlights'))).toBeNull();
    });
  });

  it('filters feature flags by name', async () => {
    renderPage();

    await userEvent.type(screen.getByRole('textbox', { name: /Search feature flags/ }), 'loki');

    expect(screen.getByText('lokiQuerySplitting')).toBeInTheDocument();
    expect(screen.queryByText('featureHighlights')).not.toBeInTheDocument();
  });
});
