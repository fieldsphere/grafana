import type { ReactNode } from 'react';

import { screen } from '@testing-library/react';

import config from 'app/core/config';
import { render } from 'test/test-utils';

import LabsFeatureFlagDashboardPage from './LabsFeatureFlagDashboardPage';

jest.mock('app/core/components/Page/Page', () => {
  const Page = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  Page.Contents = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  return { Page };
});

describe('LabsFeatureFlagDashboardPage', () => {
  const originalFeatureToggles = config.featureToggles;

  beforeEach(() => {
    config.featureToggles = {
      alphaFeatureFlag: true,
      betaFeatureFlag: false,
      ignoredObjectFlag: { nested: true } as unknown as boolean,
    };
  });

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('renders feature flags and allows toggling in runtime config', async () => {
    const { user } = render(<LabsFeatureFlagDashboardPage />, { renderWithRouter: false });

    expect(screen.getByRole('heading', { name: 'Feature flagging dashboard' })).toBeInTheDocument();
    expect(screen.getByText('1 enabled')).toBeInTheDocument();
    expect(screen.getByText('1 disabled')).toBeInTheDocument();
    expect(screen.queryByText('ignoredObjectFlag')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 2 flags (1 enabled, 1 disabled)')).toBeInTheDocument();

    const alphaToggle = document.getElementById('labs-feature-flag-alphaFeatureFlag') as HTMLInputElement;
    expect(alphaToggle).toBeChecked();

    await user.click(alphaToggle);

    expect(config.featureToggles.alphaFeatureFlag).toBe(false);
    expect(alphaToggle).not.toBeChecked();
    expect(screen.getByText('0 enabled')).toBeInTheDocument();
    expect(screen.getByText('2 disabled')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 flags (0 enabled, 2 disabled)')).toBeInTheDocument();
  });

  it('filters by feature flag name', async () => {
    const { user } = render(<LabsFeatureFlagDashboardPage />, { renderWithRouter: false });

    await user.type(screen.getByPlaceholderText('Search by flag name'), 'beta');

    expect(screen.getByText('betaFeatureFlag')).toBeInTheDocument();
    expect(screen.queryByText('alphaFeatureFlag')).not.toBeInTheDocument();
  });
});
