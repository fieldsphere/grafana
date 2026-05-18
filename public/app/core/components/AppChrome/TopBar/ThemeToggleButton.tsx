import { t } from '@grafana/i18n';
import { ToolbarButton, useTheme2 } from '@grafana/ui';
import { changeTheme } from 'app/core/services/theme';

export function ThemeToggleButton() {
  const theme = useTheme2();
  const targetThemeId = theme.isDark ? 'light' : 'dark';
  const tooltip = theme.isDark
    ? t('navigation.theme-toggle.switch-to-light', 'Switch to light theme')
    : t('navigation.theme-toggle.switch-to-dark', 'Switch to dark theme');

  return (
    <ToolbarButton
      aria-checked={theme.isDark}
      aria-label={t('navigation.theme-toggle.aria-label', 'Dark theme')}
      icon={theme.isDark ? 'toggle-on' : 'toggle-off'}
      onClick={() => changeTheme(targetThemeId, false)}
      role="switch"
      tooltip={tooltip}
    />
  );
}
