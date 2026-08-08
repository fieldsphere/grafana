import { memo, useCallback } from 'react';

import { t } from '@grafana/i18n';
import { ToolbarButton, useTheme2 } from '@grafana/ui';
import { changeTheme } from 'app/core/services/theme';

export const ThemeToggleButton = memo(function ThemeToggleButton() {
  const theme = useTheme2();
  const isDark = theme.isDark;

  const label = isDark
    ? t('navigation.theme.switch-to-light', 'Switch to light theme')
    : t('navigation.theme.switch-to-dark', 'Switch to dark theme');

  const onToggle = useCallback(() => {
    void changeTheme(isDark ? 'light' : 'dark', false);
  }, [isDark]);

  return (
    <ToolbarButton
      iconOnly
      icon="palette"
      aria-label={label}
      tooltip={label}
      onClick={onToggle}
    />
  );
});
