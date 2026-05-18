import { Components } from '@grafana/e2e-selectors';
import { render, screen, userEvent } from 'test/test-utils';

import { toggleTheme } from 'app/core/services/theme';

import { ThemeToolbarToggle } from './ThemeToolbarToggle';

jest.mock('app/core/services/theme', () => ({
  toggleTheme: jest.fn(),
}));

describe('ThemeToolbarToggle', () => {
  beforeEach(() => {
    jest.mocked(toggleTheme).mockClear();
  });

  it('exposes a toolbar test id and an accessible switch', () => {
    render(<ThemeToolbarToggle />);

    expect(screen.getByTestId(Components.NavToolbar.themeToggle)).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('invokes theme toggle when the switch is activated', async () => {
    const user = userEvent.setup();
    render(<ThemeToolbarToggle />);

    await user.click(screen.getByRole('switch'));

    expect(toggleTheme).toHaveBeenCalledTimes(1);
    expect(toggleTheme).toHaveBeenCalledWith(false);
  });
});
