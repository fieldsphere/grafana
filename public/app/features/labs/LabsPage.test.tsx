import { render, screen } from 'test/test-utils';

import { selectors } from '@grafana/e2e-selectors';
import { config } from '@grafana/runtime';

import LabsPage from './LabsPage';

describe('LabsPage', () => {
  const originalFeatureToggles = config.featureToggles;

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('lists enabled feature flags in alphabetical order and omits disabled flags', () => {
    config.featureToggles = {
      ...originalFeatureToggles,
      alertingTriage: true,
      featureHighlights: false,
      awsAsyncQueryCaching: true,
    };

    render(<LabsPage />);

    expect(screen.getByRole('heading', { name: 'Labs' })).toBeInTheDocument();
    expect(screen.getByTestId(selectors.pages.Labs.container)).toBeInTheDocument();

    const alertingRow = screen.getByTestId(selectors.pages.Labs.table.row('alertingTriage'));
    const awsRow = screen.getByTestId(selectors.pages.Labs.table.row('awsAsyncQueryCaching'));
    expect(alertingRow).toHaveTextContent('alertingTriage');
    expect(awsRow).toHaveTextContent('awsAsyncQueryCaching');
    expect(screen.queryByText('featureHighlights')).not.toBeInTheDocument();

    const rows = screen.getAllByTestId(/Labs feature-flag-row/);
    const alertingIndex = rows.indexOf(alertingRow);
    const awsIndex = rows.indexOf(awsRow);
    expect(alertingIndex).toBeGreaterThanOrEqual(0);
    expect(awsIndex).toBeGreaterThan(alertingIndex);
  });

  it('shows empty state when no feature flags are enabled', () => {
    config.featureToggles = Object.fromEntries(
      Object.keys(originalFeatureToggles).map((key) => [key, false])
    ) as typeof config.featureToggles;

    render(<LabsPage />);

    expect(screen.getByText('No feature flags are currently enabled.')).toBeInTheDocument();
    expect(screen.queryByTestId(/Labs feature-flag-row/)).not.toBeInTheDocument();
  });
});
