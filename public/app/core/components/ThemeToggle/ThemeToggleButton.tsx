import { memo } from 'react';

import { Components } from '@grafana/e2e-selectors';
import { ToolbarButton } from '@grafana/ui';

import { useThemeToggle } from './useThemeToggle';

/**
 * Top-bar dark/light toggle for standard (non-chromeless) pages.
 *
 * Placement: `SingleTopBar` right-side toolbar, after Help and before the profile
 * separator — consistent with other icon-only `ToolbarButton` controls such as
 * `HelpTopBarButton` and `TopSearchBarCommandPaletteTrigger`.
 */
export const ThemeToggleButton = memo(function ThemeToggleButton() {
  const { isDark, icon, ariaLabel, tooltip, toggle } = useThemeToggle();

  return (
    <ToolbarButton
      iconOnly
      icon={icon}
      aria-label={ariaLabel}
      aria-pressed={isDark}
      tooltip={tooltip}
      onClick={toggle}
      data-testid={Components.NavToolbar.themeToggle}
    />
  );
});
