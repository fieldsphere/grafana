import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import { Components } from '@grafana/e2e-selectors';
import { reportInteraction } from '@grafana/runtime';
import { toggleTheme } from 'app/core/services/theme';

import { ThemeToggleFloatingButton } from './ThemeToggleFloatingButton';

jest.mock('app/core/services/theme', () => ({
  toggleTheme: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  reportInteraction: jest.fn(),
}));

describe('ThemeToggleFloatingButton', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a fixed-position wrapper with the theme toggle button', () => {
    render(<ThemeToggleFloatingButton />);

    expect(screen.getByTestId(Components.NavToolbar.themeToggleFloating)).toBeInTheDocument();
    expect(screen.getByTestId(Components.NavToolbar.themeToggle)).toBeInTheDocument();
  });

  it('toggles theme and reports interaction on click', async () => {
    render(<ThemeToggleFloatingButton />);

    await user.click(screen.getByRole('button'));

    expect(reportInteraction).toHaveBeenCalledWith('grafana_preferences_theme_changed', {
      toTheme: expect.stringMatching(/^(dark|light)$/),
      preferenceType: 'toolbar_toggle',
    });
    expect(toggleTheme).toHaveBeenCalledWith(false);
  });
});
