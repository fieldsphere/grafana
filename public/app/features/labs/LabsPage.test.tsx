import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import { config } from '@grafana/runtime';
import { contextSrv } from 'app/core/services/context_srv';

import { LabsPage } from './LabsPage';

jest.mock('app/core/services/context_srv');

describe('LabsPage', () => {
  const originalFeatureToggles = { ...config.featureToggles };

  beforeEach(() => {
    window.localStorage.removeItem('grafana.featureToggles');
    config.featureToggles = { fooToggle: true, barToggle: false };
    (contextSrv.hasPermission as jest.Mock).mockImplementation((action: string) => action === 'featuremgmt.write');
  });

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('renders feature toggles from runtime settings', async () => {
    render(<LabsPage />);

    expect(await screen.findByText('fooToggle')).toBeVisible();
    expect(await screen.findByText('barToggle')).toBeVisible();
    expect(await screen.findByText('1 enabled / 2 total, 0 local overrides.')).toBeVisible();
  });

  it('saves local overrides using grafana.featureToggles key', async () => {
    const user = userEvent.setup();
    render(<LabsPage />);

    await user.click(screen.getByRole('switch', { name: 'Disabled' }));
    await user.click(screen.getByRole('button', { name: 'Save browser overrides' }));

    expect(window.localStorage.getItem('grafana.featureToggles')).toBe('barToggle=1');
    expect(await screen.findByText('Local overrides saved')).toBeVisible();
  });

  it('shows a Labs session override label', async () => {
    render(<LabsPage />);

    expect(await screen.findByText('Session override')).toBeVisible();
    expect(await screen.findByText('Labs')).toBeVisible();
  });
});
