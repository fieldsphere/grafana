import { render, screen, within } from 'test/test-utils';

import config from 'app/core/config';

import { LabsPage } from './LabsPage';

describe('LabsPage', () => {
  const originalFeatureToggles = config.featureToggles;

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('lists feature toggles from config in sorted order', () => {
    config.featureToggles = {
      alphaFeature: true,
      betaFeature: false,
    } as typeof config.featureToggles;

    render(<LabsPage />);

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    // header + 2 data rows (only keys present in config.featureToggles are listed)
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText('alphaFeature')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Yes')).toBeInTheDocument();
    expect(within(rows[2]).getByText('betaFeature')).toBeInTheDocument();
    expect(within(rows[2]).getByText('No')).toBeInTheDocument();
  });
});
