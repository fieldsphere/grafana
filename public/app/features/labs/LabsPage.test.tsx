import { config } from '@grafana/runtime';
import { render, screen } from 'test/test-utils';

import LabsPage from './LabsPage';

describe('LabsPage', () => {
  const originalToggles = config.featureToggles;

  afterEach(() => {
    config.featureToggles = originalToggles;
  });

  it('lists enabled feature flags sorted alphabetically', () => {
    config.featureToggles = {
      ...originalToggles,
      zebraFlag: true,
      alphaFlag: true,
      offFlag: false,
    };

    render(<LabsPage />);

    const pre = screen.getByTestId('labs-enabled-flags');
    expect(pre.textContent).toBe('alphaFlag\nzebraFlag');
  });

  it('shows empty state when no flags are enabled', () => {
    config.featureToggles = {};

    render(<LabsPage />);

    expect(screen.queryByTestId('labs-enabled-flags')).not.toBeInTheDocument();
    expect(screen.getByText(/No enabled feature flags/i)).toBeInTheDocument();
  });
});
