import { useCallback } from 'react';

import { reportInteraction } from '@grafana/runtime';
import { useTheme2 } from '@grafana/ui';
import { toggleTheme } from 'app/core/services/theme';

import {
  getTargetThemeId,
  getThemeToggleAriaLabel,
  getThemeToggleIcon,
  getThemeToggleTooltip,
} from './themeToggleUtils';

export interface ThemeToggleState {
  isDark: boolean;
  icon: ReturnType<typeof getThemeToggleIcon>;
  ariaLabel: string;
  tooltip: string;
  toggle: () => Promise<void>;
}

export function useThemeToggle(): ThemeToggleState {
  const theme = useTheme2();
  const isDark = theme.isDark;

  const toggle = useCallback(async () => {
    const toTheme = getTargetThemeId(isDark);

    reportInteraction('grafana_preferences_theme_changed', {
      toTheme,
      preferenceType: 'toolbar_toggle',
    });

    await toggleTheme(false);
  }, [isDark]);

  return {
    isDark,
    icon: getThemeToggleIcon(isDark),
    ariaLabel: getThemeToggleAriaLabel(isDark),
    tooltip: getThemeToggleTooltip(isDark),
    toggle,
  };
}
