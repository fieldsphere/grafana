import { render, screen } from '@testing-library/react';

import { LabsFeatureFlagsTable } from './LabsFeatureFlagsTable';
import { type LabsFeatureToggle } from './types';

const featureToggles: LabsFeatureToggle[] = [
  {
    name: 'adHocFilterDefaultValues',
    description: 'Enables configuring default origin filters for ad-hoc filter variables',
    stage: 'experimental',
    enabled: true,
  },
  {
    name: 'panelTitleSearch',
    description: 'Search for dashboards using panel title',
    stage: 'preview',
    enabled: false,
  },
];

describe('LabsFeatureFlagsTable', () => {
  it('renders open feature flags', () => {
    render(<LabsFeatureFlagsTable featureToggles={featureToggles} />);

    expect(screen.getByText('adHocFilterDefaultValues')).toBeInTheDocument();
    expect(screen.getByText('panelTitleSearch')).toBeInTheDocument();
    expect(screen.getByText('Experimental')).toBeInTheDocument();
    expect(screen.getByText('Public preview')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });
});
