import { render, screen } from 'test/test-utils';

import { config } from '@grafana/runtime';

import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

import LabsFeatureFlagsPage from './LabsFeatureFlagsPage';

describe('LabsFeatureFlagsPage', () => {
  const originalToggles = config.featureToggles;

  afterEach(() => {
    config.featureToggles = originalToggles;
    jest.restoreAllMocks();
  });

  it('shows access denied without featuremgmt.read', () => {
    jest.spyOn(contextSrv, 'hasPermission').mockImplementation((action) => action !== AccessControlAction.FeatureManagementRead);

    render(<LabsFeatureFlagsPage />);

    expect(screen.getByText(/Access denied/i)).toBeInTheDocument();
  });

  it('lists feature toggles when user has featuremgmt.read', () => {
    jest.spyOn(contextSrv, 'hasPermission').mockImplementation((action) => action === AccessControlAction.FeatureManagementRead);
    config.featureToggles = { ...originalToggles, someTestToggle: true, anotherToggle: false };

    render(<LabsFeatureFlagsPage />);

    expect(screen.getByText('someTestToggle')).toBeInTheDocument();
    expect(screen.getByText('anotherToggle')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Filter by name/i)).toBeInTheDocument();
  });
});
