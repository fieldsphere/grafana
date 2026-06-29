import { render, screen } from '@testing-library/react';
import { TestProvider } from 'test/helpers/TestProvider';

import LabsFeatureTogglesPage from './LabsFeatureTogglesPage';

describe('LabsFeatureTogglesPage', () => {
  it('renders the first-pass placeholder copy', () => {
    render(
      <TestProvider>
        <LabsFeatureTogglesPage />
      </TestProvider>
    );

    expect(screen.getByRole('heading', { name: 'Feature toggles' })).toBeInTheDocument();
    expect(screen.getByText('Labs is a new home for experimental Grafana experiences.')).toBeInTheDocument();
    expect(
      screen.getByText(/This first pass adds a placeholder for feature flag controls/i)
    ).toBeInTheDocument();
  });
});
