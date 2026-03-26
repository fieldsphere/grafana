import { t } from '@grafana/i18n';
import { reportInteraction } from '@grafana/runtime';
import { ToolbarButton, useTheme2 } from '@grafana/ui';
import { useMediaQueryMinWidth } from 'app/core/hooks/useMediaQueryMinWidth';
import { changeTheme } from 'app/core/services/theme';

export function ThemeToggleButton() {
  const theme = useTheme2();
  const isLargeScreen = useMediaQueryMinWidth('lg');
  const nextTheme = theme.isDark ? 'light' : 'dark';
  const ariaLabel = theme.isDark
    ? t('navigation.theme-toggle.to-light', 'Switch to light theme')
    : t('navigation.theme-toggle.to-dark', 'Switch to dark theme');
  const buttonText = theme.isDark
    ? t('navigation.theme-toggle.light-label', 'Light')
    : t('navigation.theme-toggle.dark-label', 'Dark');

  const onToggleTheme = async () => {
    reportInteraction('grafana_theme_toggle_clicked', {
      toTheme: nextTheme,
      placement: 'top_bar',
    });
    await changeTheme(nextTheme, false);
  };

  return (
    <ToolbarButton
      icon="palette"
      iconOnly={!isLargeScreen}
      aria-label={ariaLabel}
      tooltip={ariaLabel}
      onClick={() => void onToggleTheme()}
    >
      {isLargeScreen ? buttonText : undefined}
    </ToolbarButton>
  );
}
