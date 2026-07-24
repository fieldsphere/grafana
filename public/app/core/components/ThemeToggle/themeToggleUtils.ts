import { type IconName } from '@grafana/data';
import { t } from '@grafana/i18n';

/**
 * Icons represent the target mode after toggling (not the current mode).
 *
 * Grafana's icon set does not include dedicated sun/moon glyphs yet; these pair
 * lightbulb-alt (switch to light) with adjust-circle (switch to dark) as the
 * closest semantic match in @grafana/data IconName.
 */
export function getThemeToggleIcon(isDark: boolean): IconName {
  return isDark ? 'lightbulb-alt' : 'adjust-circle';
}

export function getThemeToggleAriaLabel(isDark: boolean): string {
  return isDark
    ? t('navigation.theme.toggle-to-light-aria-label', 'Switch to light theme')
    : t('navigation.theme.toggle-to-dark-aria-label', 'Switch to dark theme');
}

export function getThemeToggleTooltip(isDark: boolean): string {
  const targetTheme = isDark
    ? t('command-palette.action.light-theme', 'Light')
    : t('command-palette.action.dark-theme', 'Dark');

  return t('navigation.theme.toggle-tooltip', 'Switch to {{targetTheme}} theme (c t)', { targetTheme });
}

export function getTargetThemeId(isDark: boolean): 'dark' | 'light' {
  return isDark ? 'light' : 'dark';
}
