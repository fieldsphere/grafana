import { screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import LabsPage, { getActiveFeatureFlags } from './LabsPage';

describe('getActiveFeatureFlags', () => {
  it('returns only active feature flags in sorted order', () => {
    expect(
      getActiveFeatureFlags({
        zebraFlag: true,
        alphaFlag: true,
        disabledFlag: false,
        unknownFlag: undefined,
      })
    ).toEqual(['alphaFlag', 'zebraFlag']);
  });
});

describe('LabsPage', () => {
  it('renders active feature flags only', () => {
    render(
      <LabsPage
        featureToggles={{
          thirdFlag: true,
          firstFlag: true,
          secondFlag: false,
        }}
      />
    );

    expect(screen.getByText('firstFlag')).toBeInTheDocument();
    expect(screen.getByText('thirdFlag')).toBeInTheDocument();
    expect(screen.queryByText('secondFlag')).not.toBeInTheDocument();
  });

  it('renders an empty state when no feature flags are active', () => {
    render(
      <LabsPage
        featureToggles={{
          disabledFlag: false,
        }}
      />
    );

    expect(screen.getByText('No active feature flags')).toBeInTheDocument();
  });
});
