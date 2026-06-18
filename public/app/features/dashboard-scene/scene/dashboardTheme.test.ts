import { createTheme } from '@grafana/data';

import {
  getDashboardThemeSelection,
  getNextDashboardThemeStyle,
  getUrlDashboardTheme,
  isDashboardThemeStyle,
  resolveDashboardTheme,
} from './dashboardTheme';

describe('dashboardTheme', () => {
  const lightTheme = createTheme({ colors: { mode: 'light' } });
  const darkTheme = createTheme({ colors: { mode: 'dark' } });

  describe('isDashboardThemeStyle', () => {
    it('accepts light and dark values', () => {
      expect(isDashboardThemeStyle('light')).toBe(true);
      expect(isDashboardThemeStyle('dark')).toBe(true);
    });

    it('rejects other values', () => {
      expect(isDashboardThemeStyle('current')).toBe(false);
      expect(isDashboardThemeStyle(undefined)).toBe(false);
    });
  });

  describe('getDashboardThemeSelection', () => {
    it('returns default when style is unset', () => {
      expect(getDashboardThemeSelection(undefined)).toBe('default');
    });

    it('returns the saved style when set', () => {
      expect(getDashboardThemeSelection('dark')).toBe('dark');
      expect(getDashboardThemeSelection('light')).toBe('light');
    });
  });

  describe('resolveDashboardTheme', () => {
    const originalSearch = window.location.search;

    afterEach(() => {
      window.history.replaceState({}, '', `${window.location.pathname}${originalSearch}`);
    });

    it('uses the dashboard style when set', () => {
      const theme = resolveDashboardTheme('light', darkTheme);
      expect(theme.isLight).toBe(true);
    });

    it('falls back to the global theme when style is unset', () => {
      const theme = resolveDashboardTheme(undefined, darkTheme);
      expect(theme.isDark).toBe(true);
    });

    it('prefers the URL theme over the dashboard style', () => {
      const theme = resolveDashboardTheme('light', darkTheme, '?theme=dark');
      expect(theme.isDark).toBe(true);
    });
  });

  describe('getUrlDashboardTheme', () => {
    const originalSearch = window.location.search;

    afterEach(() => {
      window.history.replaceState({}, '', `${window.location.pathname}${originalSearch}`);
    });

    it('returns a valid theme from the URL', () => {
      expect(getUrlDashboardTheme('?theme=light')).toBe('light');
    });

    it('returns undefined for invalid values', () => {
      expect(getUrlDashboardTheme('?theme=current')).toBeUndefined();
    });
  });

  describe('getNextDashboardThemeStyle', () => {
    it('switches from dark to light', () => {
      expect(getNextDashboardThemeStyle('dark', darkTheme)).toBe('light');
    });

    it('switches from light to dark', () => {
      expect(getNextDashboardThemeStyle('light', lightTheme)).toBe('dark');
    });
  });
});
