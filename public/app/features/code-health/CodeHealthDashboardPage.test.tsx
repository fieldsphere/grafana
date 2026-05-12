import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProvider } from 'test/helpers/TestProvider';
import { getGrafanaContextMock } from 'test/mocks/getGrafanaContextMock';

import { config } from '@grafana/runtime';
import { HOME_NAV_ID } from 'app/core/reducers/navModel';

import CodeHealthDashboardPage from './CodeHealthDashboardPage';
import { __test_resetCodeHealthFetchState, __test_simulateFetchFailureOnce } from './codeHealthDashboardData';

describe('CodeHealthDashboardPage', () => {
  let navBackup: typeof config.bootData.navTree;

  beforeEach(() => {
    __test_resetCodeHealthFetchState();
    navBackup = config.bootData.navTree;

    config.bootData.navTree = [
      {
        id: HOME_NAV_ID,
        text: 'Home',
        url: '/',
        icon: 'home-alt',
      },
      {
        id: 'code-health',
        text: 'Code health',
        url: '/code-health',
        icon: 'heart-rate',
        subTitle: 'Demo overview',
        sortWeight: -3450,
      },
    ];
  });

  afterEach(() => {
    jest.restoreAllMocks();
    config.bootData.navTree = navBackup;
  });

  function renderPage() {
    return render(
      <TestProvider grafanaContext={getGrafanaContextMock()}>
        <CodeHealthDashboardPage />
      </TestProvider>
    );
  }

  it('shows summary metrics once demo data resolves', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('code-health-card-lint')).toBeInTheDocument();
      expect(screen.getByTestId('code-health-card-coverage')).toBeInTheDocument();
    });

    expect(screen.getByText(/Lint backlog by tier/i)).toBeInTheDocument();
    expect(screen.getByText(/Prioritized recommendations/i)).toBeInTheDocument();
  });

  it('reloads summaries when timeframe filter changes', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByTestId('code-health-card-ci')).toHaveTextContent('96%'));

    await user.click(screen.getByRole('radio', { name: /7 days/i }));

    await waitFor(() => expect(screen.getByTestId('code-health-card-ci')).toHaveTextContent('92%'));
  });

  it('shows an alert when loading fails and recovers via retry', async () => {
    __test_simulateFetchFailureOnce();
    const user = userEvent.setup();

    renderPage();

    await waitFor(() => expect(screen.getByRole('alert', { name: /Could not refresh metrics/i })).toBeInTheDocument());

    const retryBtn = screen.getByText('Retry').closest('button');
    expect(retryBtn).not.toBeNull();

    await user.click(retryBtn!);

    await waitFor(() => expect(screen.getByTestId('code-health-card-lint')).toBeInTheDocument());
  });
});
