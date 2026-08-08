import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import { reportInteraction } from '@grafana/runtime';

import { changeTheme } from 'app/core/services/theme';

import { ThemeToggleButton } from './ThemeToggleButton';

const mockUseTheme2 = jest.fn();

jest.mock('@grafana/ui', () => {
  const actual = jest.requireActual('@grafana/ui');
  return {
    ...actual,
    useTheme2: () => mockUseTheme2(),
  };
});

jest.mock('app/core/services/theme', () => ({
  changeTheme: jest.fn(),
}));

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  reportInteraction: jest.fn(),
}));

describe('ThemeToggleButton', () => {
  const mockChangeTheme = jest.mocked(changeTheme);
  const mockReportInteraction = jest.mocked(reportInteraction);

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
      writable: true,
    });
  });

  it('switches from dark to light theme', async () => {
    mockUseTheme2.mockReturnValue({
      isDark: true,
      breakpoints: {
        values: {
          lg: 1200,
        },
      },
    });
    const user = userEvent.setup();

    render(<ThemeToggleButton />);

    await user.click(screen.getByRole('button', { name: /switch to light theme/i }));

    expect(mockReportInteraction).toHaveBeenCalledWith('grafana_theme_toggle_clicked', {
      toTheme: 'light',
      placement: 'top_bar',
    });
    expect(mockChangeTheme).toHaveBeenCalledWith('light', false);
  });

  it('switches from light to dark theme', async () => {
    mockUseTheme2.mockReturnValue({
      isDark: false,
      breakpoints: {
        values: {
          lg: 1200,
        },
      },
    });
    const user = userEvent.setup();

    render(<ThemeToggleButton />);

    await user.click(screen.getByRole('button', { name: /switch to dark theme/i }));

    expect(mockReportInteraction).toHaveBeenCalledWith('grafana_theme_toggle_clicked', {
      toTheme: 'dark',
      placement: 'top_bar',
    });
    expect(mockChangeTheme).toHaveBeenCalledWith('dark', false);
  });
});
