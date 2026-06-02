import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import { config } from '@grafana/runtime';

import FeatureTogglesPage from './FeatureTogglesPage';

const LOCALSTORAGE_KEY = 'grafana.featureToggles';

describe('FeatureTogglesPage', () => {
  const originalToggles = { ...config.featureToggles };

  beforeEach(() => {
    config.featureToggles = { featureA: true, featureB: false, featureC: true } as Record<string, boolean>;
    window.localStorage.removeItem(LOCALSTORAGE_KEY);
  });

  afterEach(() => {
    config.featureToggles = originalToggles;
    window.localStorage.removeItem(LOCALSTORAGE_KEY);
  });

  it('renders the toggle table with all feature flags', () => {
    render(<FeatureTogglesPage />);

    expect(screen.getByText('featureA')).toBeInTheDocument();
    expect(screen.getByText('featureB')).toBeInTheDocument();
    expect(screen.getByText('featureC')).toBeInTheDocument();
  });

  it('shows correct enabled/disabled badges', () => {
    render(<FeatureTogglesPage />);

    const rows = screen.getAllByRole('row').slice(1);
    const enabledCount = rows.filter((row) => row.textContent?.includes('Enabled')).length;
    const disabledCount = rows.filter((row) => row.textContent?.includes('Disabled')).length;

    expect(enabledCount).toBe(2);
    expect(disabledCount).toBe(1);
  });

  it('filters toggles by search input', async () => {
    render(<FeatureTogglesPage />);

    const searchInput = screen.getByPlaceholderText('Search feature toggles...');
    await userEvent.type(searchInput, 'featureA');

    expect(screen.getByText('featureA')).toBeInTheDocument();
    expect(screen.queryByText('featureB')).not.toBeInTheDocument();
    expect(screen.queryByText('featureC')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 3 feature toggles')).toBeInTheDocument();
  });

  it('shows reload alert after toggling a feature', async () => {
    render(<FeatureTogglesPage />);

    expect(screen.queryByText('Reload required')).not.toBeInTheDocument();

    const switches = screen.getAllByRole('switch');
    await userEvent.click(switches[0]);

    expect(screen.getByText('Reload required')).toBeInTheDocument();
  });

  it('persists overrides to localStorage', async () => {
    render(<FeatureTogglesPage />);

    const switches = screen.getAllByRole('switch');
    // featureA is enabled server-side; toggling it off creates an override
    await userEvent.click(switches[0]);

    const stored = window.localStorage.getItem(LOCALSTORAGE_KEY);
    expect(stored).toContain('featureA=0');
  });

  it('shows Override badge for locally overridden toggles', async () => {
    window.localStorage.setItem(LOCALSTORAGE_KEY, 'featureB=1');
    render(<FeatureTogglesPage />);

    expect(screen.getByText('Override')).toBeInTheDocument();
  });

  it('shows clear overrides button when overrides exist', async () => {
    window.localStorage.setItem(LOCALSTORAGE_KEY, 'featureB=1');
    render(<FeatureTogglesPage />);

    const clearButton = screen.getByText(/Clear all overrides/);
    expect(clearButton).toBeInTheDocument();

    await userEvent.click(clearButton);

    expect(window.localStorage.getItem(LOCALSTORAGE_KEY)).toBeNull();
  });

  it('shows empty state when search matches nothing', async () => {
    render(<FeatureTogglesPage />);

    const searchInput = screen.getByPlaceholderText('Search feature toggles...');
    await userEvent.type(searchInput, 'nonexistent');

    expect(screen.getByText('No feature toggles match your search.')).toBeInTheDocument();
  });
});
