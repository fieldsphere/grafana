import { render, screen } from '@testing-library/react';
import React from 'react';

import { createTheme, ThemeContext } from '@grafana/data';

import { DashboardThemeProvider } from './DashboardThemeProvider';

const useLocationMock = jest.fn();

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => useLocationMock(),
}));

function ThemeConsumer() {
  const theme = React.useContext(ThemeContext);
  return <div data-testid="theme-mode">{theme.isDark ? 'dark' : 'light'}</div>;
}

describe('DashboardThemeProvider', () => {
  const globalTheme = createTheme({ colors: { mode: 'dark' } });

  function renderWithGlobalTheme(style?: string, search = '') {
    useLocationMock.mockReturnValue({ search });

    return render(
      <ThemeContext.Provider value={globalTheme}>
        <DashboardThemeProvider style={style}>
          <ThemeConsumer />
        </DashboardThemeProvider>
      </ThemeContext.Provider>
    );
  }

  it('uses the global theme when no dashboard style is set', () => {
    renderWithGlobalTheme();
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
  });

  it('overrides the global theme when a dashboard style is set', () => {
    renderWithGlobalTheme('light');
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
  });

  it('prefers the URL theme over the dashboard style', () => {
    renderWithGlobalTheme('light', '?theme=dark');
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
  });
});
