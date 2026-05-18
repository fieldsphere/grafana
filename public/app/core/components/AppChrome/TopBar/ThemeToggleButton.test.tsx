import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import { createTheme, ThemeContext } from '@grafana/data';
import { changeTheme } from 'app/core/services/theme';

import { ThemeToggleButton } from './ThemeToggleButton';

jest.mock('app/core/services/theme', () => ({
  changeTheme: jest.fn(),
}));

describe('ThemeToggleButton', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('switches from dark to light and persists the preference', async () => {
    render(
      <ThemeContext.Provider value={createTheme({ colors: { mode: 'dark' } })}>
        <ThemeToggleButton />
      </ThemeContext.Provider>
    );

    const toggle = screen.getByRole('switch', { name: 'Dark theme' });

    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await user.click(toggle);

    expect(changeTheme).toHaveBeenCalledWith('light', false);
  });

  it('switches from light to dark and persists the preference', async () => {
    render(
      <ThemeContext.Provider value={createTheme({ colors: { mode: 'light' } })}>
        <ThemeToggleButton />
      </ThemeContext.Provider>
    );

    const toggle = screen.getByRole('switch', { name: 'Dark theme' });

    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await user.click(toggle);

    expect(changeTheme).toHaveBeenCalledWith('dark', false);
  });
});
