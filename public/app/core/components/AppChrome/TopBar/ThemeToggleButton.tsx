import { memo, useCallback } from 'react';

import { type IconName } from '@grafana/data';
import { Components } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import { reportInteraction } from '@grafana/runtime';
import { ToolbarButton, useTheme2 } from '@grafana/ui';
import { toggleTheme } from 'app/core/services/theme';

export const ThemeToggleButton = memo(function ThemeToggleButton() {
  const grafanaTheme = useTheme2();
  const isDark = grafanaTheme.isDark;

  const label = isDark
    ? t('navigation.theme-toggle.switch-to-light', 'Switch to light theme')
    : t('navigation.theme-toggle.switch-to-dark', 'Switch to dark theme');

  const icon: IconName = isDark ? 'lightbulb-alt' : 'laptop-cloud';

  const onClick = useCallback(() => {
    reportInteraction('navigation_theme_toggle_clicked', {
      fromMode: isDark ? 'dark' : 'light',
    });
    void toggleTheme(false);
  }, [isDark]);

  return (
    <ToolbarButton
      iconOnly
      icon={icon}
      tooltip={label}
      aria-label={label}
      onClick={onClick}
      data-testid={Components.NavToolbar.themeToggle}
    />
  );
});
