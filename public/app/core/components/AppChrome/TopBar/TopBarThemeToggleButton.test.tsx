import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import { reportInteraction } from '@grafana/runtime';
import { useTheme2 } from '@grafana/ui';
import { toggleTheme } from 'app/core/services/theme';

import { TopBarThemeToggleButton } from './TopBarThemeToggleButton';

jest.mock('app/core/services/theme', () => ({
  toggleTheme: jest.fn(),
}));

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  reportInteraction: jest.fn(),
}));

jest.mock('@grafana/ui', () => ({
  ...jest.requireActual('@grafana/ui'),
  useTheme2: jest.fn(),
}));

const mockToggleTheme = jest.mocked(toggleTheme);
const mockUseTheme2 = jest.mocked(useTheme2);
const mockReportInteraction = jest.mocked(reportInteraction);

describe('TopBarThemeToggleButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders an accessible label for dark mode users', () => {
    mockUseTheme2.mockReturnValue({
      isDark: true,
    } as ReturnType<typeof useTheme2>);

    render(<TopBarThemeToggleButton />);

    expect(screen.getByRole('button', { name: /switch to light theme/i })).toBeInTheDocument();
  });

  it('renders an accessible label for light mode users', () => {
    mockUseTheme2.mockReturnValue({
      isDark: false,
    } as ReturnType<typeof useTheme2>);

    render(<TopBarThemeToggleButton />);

    expect(screen.getByRole('button', { name: /switch to dark theme/i })).toBeInTheDocument();
  });

  it('toggles and persists theme preference when clicked', async () => {
    const user = userEvent.setup();
    mockUseTheme2.mockReturnValue({
      isDark: true,
    } as ReturnType<typeof useTheme2>);

    render(<TopBarThemeToggleButton />);

    await user.click(screen.getByRole('button', { name: /switch to light theme/i }));

    expect(mockReportInteraction).toHaveBeenCalledWith('grafana_preferences_theme_changed', {
      toTheme: 'light',
      preferenceType: 'top_bar_toggle',
    });
    expect(mockToggleTheme).toHaveBeenCalledWith(false);
  });
});
