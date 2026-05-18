import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import { reportInteraction } from '@grafana/runtime';
import * as themeService from 'app/core/services/theme';

import { ThemeToggleButton } from './ThemeToggleButton';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  reportInteraction: jest.fn(),
}));

jest.mock('app/core/services/theme', () => ({
  toggleTheme: jest.fn(),
}));

const mockToggleTheme = jest.mocked(themeService.toggleTheme);
const mockReportInteraction = jest.mocked(reportInteraction);

describe('ThemeToggleButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls toggleTheme(false) when clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggleButton />);

    await user.click(screen.getByRole('button', { name: /switch to (light|dark) theme/i }));

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    expect(mockToggleTheme).toHaveBeenCalledWith(false);
    expect(mockReportInteraction).toHaveBeenCalledWith(
      'navigation_theme_toggle_clicked',
      expect.objectContaining({ fromMode: expect.stringMatching(/^(dark|light)$/) })
    );
  });
});
