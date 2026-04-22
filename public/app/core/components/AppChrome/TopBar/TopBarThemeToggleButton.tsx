import { memo } from 'react';

import { t } from '@grafana/i18n';
import { reportInteraction } from '@grafana/runtime';
import { ToolbarButton, useTheme2 } from '@grafana/ui';
import { toggleTheme } from 'app/core/services/theme';

export const TopBarThemeToggleButton = memo(function TopBarThemeToggleButton() {
  const theme = useTheme2();
  const nextTheme = theme.isDark ? 'light' : 'dark';
  const label = theme.isDark
    ? t('navigation.theme-toggle.switch-to-light', 'Switch to light theme')
    : t('navigation.theme-toggle.switch-to-dark', 'Switch to dark theme');

  const onToggleTheme = async () => {
    reportInteraction('grafana_preferences_theme_changed', {
      toTheme: nextTheme,
      preferenceType: 'top_bar_toggle',
    });
    await toggleTheme(false);
  };

  return <ToolbarButton iconOnly icon="palette" aria-label={label} tooltip={label} onClick={onToggleTheme} />;
});
