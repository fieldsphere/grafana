import { screen, within } from '@testing-library/react';
import { render } from 'test/test-utils';

import { type NavIndex } from '@grafana/data';

import { CodeHealthPage } from './CodeHealthPage';
import { getMetrics, getRecommendedActions } from './mockData';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  useChromeHeaderHeight: jest.fn(),
}));

const navIndex: NavIndex = {
  'code-health': {
    id: 'code-health',
    text: 'Code health',
    subTitle: 'Repository quality signals and recommended actions',
    icon: 'heart-rate',
    url: '/code-health',
  },
};

const renderPage = () =>
  render(<CodeHealthPage />, {
    preloadedState: { navIndex },
  });

describe('CodeHealthPage', () => {
  it('renders the page heading and the default 7-day metric snapshot', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /repository code health/i })).toBeInTheDocument();

    const metrics = getMetrics('7d');
    for (const metric of metrics) {
      const card = screen.getByTestId(`code-health-metric-${metric.id}`);
      expect(card).toHaveTextContent(metric.label);
      expect(card).toHaveTextContent(`${metric.value}${metric.unit ?? ''}`);
    }
  });

  it('renders a trend chart for the initially-selected metric', () => {
    renderPage();

    const chart = screen.getByTestId('code-health-trend-chart');
    const firstMetric = getMetrics('7d')[0];
    expect(within(chart).getByRole('heading', { name: `${firstMetric.label} trend` })).toBeInTheDocument();
    expect(within(chart).getByRole('img', { name: /trend over the selected period/i })).toBeInTheDocument();
  });

  it('renders the recommended actions list with their priority badges', () => {
    renderPage();

    const list = screen.getByTestId('code-health-actions-list');
    const actions = getRecommendedActions('7d');

    expect(within(list).getAllByRole('listitem')).toHaveLength(actions.length);
    for (const action of actions) {
      const item = screen.getByTestId(`code-health-action-${action.id}`);
      expect(item).toHaveTextContent(action.title);
      expect(item).toHaveTextContent(`Area: ${action.area}`);
    }
  });

  it('updates metrics, the trend chart, and recommended actions when the time range changes', async () => {
    const { user } = renderPage();

    const earliestLintCard = screen.getByTestId('code-health-metric-lint-errors');
    expect(earliestLintCard).toHaveTextContent(`${getMetrics('7d')[0].value}`);

    await user.click(screen.getByRole('radio', { name: /last 90 days/i }));

    const updatedLintCard = screen.getByTestId('code-health-metric-lint-errors');
    const ninetyDayLint = getMetrics('90d').find((metric) => metric.id === 'lint-errors')!;
    expect(updatedLintCard).toHaveTextContent(`${ninetyDayLint.value}`);

    const ninetyDayActions = getRecommendedActions('90d');
    for (const action of ninetyDayActions) {
      expect(screen.getByTestId(`code-health-action-${action.id}`)).toBeInTheDocument();
    }
  });

  it('changes the trend chart when a different metric card is selected', async () => {
    const { user } = renderPage();

    const initialChartHeading = within(screen.getByTestId('code-health-trend-chart')).getByRole('heading');
    expect(initialChartHeading).toHaveTextContent(/lint errors trend/i);

    await user.click(screen.getByTestId('code-health-metric-test-coverage'));

    const updatedHeading = within(screen.getByTestId('code-health-trend-chart')).getByRole('heading');
    expect(updatedHeading).toHaveTextContent(/test coverage trend/i);
  });
});
