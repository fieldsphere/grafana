import { screen, within } from '@testing-library/react';

import { config } from '@grafana/runtime';
import { render } from 'test/test-utils';

import { LabsFeatureFlagsTable } from './LabsPage';

describe('LabsFeatureFlagsTable', () => {
  it('lists known feature toggle keys', () => {
    config.featureToggles.alertingBulkActionsInUI = true;

    render(<LabsFeatureFlagsTable />);

    expect(screen.getByRole('columnheader', { name: /feature flag/i })).toBeInTheDocument();

    const flagCell = screen.getByRole('cell', { name: 'alertingBulkActionsInUI' });
    const flagRow = flagCell.closest('tr');
    expect(flagRow).not.toBeNull();
    expect(within(flagRow!).getByText('Yes')).toBeInTheDocument();
  });
});
