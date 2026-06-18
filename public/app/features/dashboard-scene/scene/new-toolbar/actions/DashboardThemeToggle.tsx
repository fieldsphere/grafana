import { useCallback } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { t } from '@grafana/i18n';
import { ToolbarButton, useTheme2 } from '@grafana/ui';

import { getNextDashboardThemeStyle, resolveDashboardTheme } from '../../dashboardTheme';
import { type ToolbarActionProps } from '../types';

export const DashboardThemeToggle = ({ dashboard }: ToolbarActionProps) => {
  const globalTheme = useTheme2();
  const location = useLocation();
  const { style } = dashboard.useState();

  const onToggleTheme = useCallback(() => {
    const nextStyle = getNextDashboardThemeStyle(style, globalTheme, location.search);
    dashboard.setState({ style: nextStyle, isDirty: true });
  }, [dashboard, globalTheme, location.search, style]);

  const effectiveTheme = resolveDashboardTheme(style, globalTheme, location.search);
  const effectiveStyle = effectiveTheme.isDark ? 'dark' : 'light';
  const tooltip =
    effectiveStyle === 'dark'
      ? t('dashboard.toolbar.theme-toggle.light', 'Switch dashboard to light theme')
      : t('dashboard.toolbar.theme-toggle.dark', 'Switch dashboard to dark theme');

  return (
    <ToolbarButton
      tooltip={tooltip}
      icon={effectiveStyle === 'dark' ? 'sun' : 'moon'}
      onClick={onToggleTheme}
      aria-label={tooltip}
    />
  );
};
