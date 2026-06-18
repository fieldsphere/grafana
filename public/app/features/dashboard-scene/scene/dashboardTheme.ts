import { getThemeById, type GrafanaTheme2 } from '@grafana/data';

export type DashboardThemeStyle = 'light' | 'dark';

export type DashboardThemeSelection = 'default' | DashboardThemeStyle;

export function isDashboardThemeStyle(value: unknown): value is DashboardThemeStyle {
  return value === 'light' || value === 'dark';
}

export function getDashboardThemeSelection(style?: string): DashboardThemeSelection {
  return isDashboardThemeStyle(style) ? style : 'default';
}

export function getUrlDashboardTheme(search = window.location.search): DashboardThemeStyle | undefined {
  const theme = new URLSearchParams(search).get('theme');
  return isDashboardThemeStyle(theme) ? theme : undefined;
}

export function resolveDashboardTheme(
  style: string | undefined,
  globalTheme: GrafanaTheme2,
  search = window.location.search
): GrafanaTheme2 {
  const urlTheme = getUrlDashboardTheme(search);
  if (urlTheme) {
    return getThemeById(urlTheme);
  }

  if (isDashboardThemeStyle(style)) {
    return getThemeById(style);
  }

  return globalTheme;
}

export function getNextDashboardThemeStyle(
  currentStyle: string | undefined,
  globalTheme: GrafanaTheme2,
  search = window.location.search
): DashboardThemeStyle {
  const effectiveTheme = resolveDashboardTheme(currentStyle, globalTheme, search);
  return effectiveTheme.isDark ? 'light' : 'dark';
}
