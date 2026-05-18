import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTheme, ThemeContext } from '@grafana/data';
import * as themeService from 'app/core/services/theme';

import { ThemeToggleButton } from './ThemeToggleButton';

jest.mock('app/core/services/theme', () => ({
  changeTheme: jest.fn(),
}));

function renderToggle(mode: 'dark' | 'light') {
  const theme = createTheme({ colors: { mode } });

  const ui = render(
    <ThemeContext.Provider value={theme}>
      <ThemeToggleButton />
    </ThemeContext.Provider>
  );

  return { ...ui, user: userEvent.setup() };
}

describe('ThemeToggleButton', () => {
  beforeEach(() => {
    jest.mocked(themeService.changeTheme).mockClear();
  });

  it('calls changeTheme with light when the current theme is dark', async () => {
    const { user } = renderToggle('dark');

    const btn = screen.getByRole('button', { name: /switch to light theme/i });
    await user.click(btn);

    expect(themeService.changeTheme).toHaveBeenCalledWith('light', false);
  });

  it('calls changeTheme with dark when the current theme is light', async () => {
    const { user } = renderToggle('light');

    const btn = screen.getByRole('button', { name: /switch to dark theme/i });
    await user.click(btn);

    expect(themeService.changeTheme).toHaveBeenCalledWith('dark', false);
  });
});
