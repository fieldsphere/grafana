import { useMemo } from 'react';
import * as React from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';
import { useLocation } from 'react-router-dom-v5-compat';

import { ThemeContext } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';

import { resolveDashboardTheme } from './dashboardTheme';

interface DashboardThemeProviderProps {
  style?: string;
  children: React.ReactNode;
}

export function DashboardThemeProvider({ style, children }: DashboardThemeProviderProps) {
  const globalTheme = useTheme2();
  const location = useLocation();
  const theme = useMemo(
    () => resolveDashboardTheme(style, globalTheme, location.search),
    [style, globalTheme, location.search]
  );

  return (
    <ThemeContext.Provider value={theme}>
      <SkeletonTheme
        baseColor={theme.colors.emphasize(theme.colors.background.secondary)}
        highlightColor={theme.colors.emphasize(theme.colors.background.secondary, 0.1)}
        borderRadius={theme.shape.radius.default}
      >
        {children}
      </SkeletonTheme>
    </ThemeContext.Provider>
  );
}
