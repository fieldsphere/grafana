import { css } from '@emotion/css';
import { memo } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { Components } from '@grafana/e2e-selectors';
import { ToolbarButton, useStyles2 } from '@grafana/ui';

import { useThemeToggle } from './useThemeToggle';

interface Props {
  className?: string;
}

/**
 * Fixed-position dark/light toggle for chromeless surfaces (login, signup, etc.)
 * where `SingleTopBar` is not rendered.
 */
export const ThemeToggleFloatingButton = memo(function ThemeToggleFloatingButton({ className }: Props) {
  const styles = useStyles2(getStyles);
  const { isDark, icon, ariaLabel, tooltip, toggle } = useThemeToggle();

  return (
    <div className={css(styles.wrapper, className)} data-testid={Components.NavToolbar.themeToggleFloating}>
      <ToolbarButton
        iconOnly
        icon={icon}
        aria-label={ariaLabel}
        aria-pressed={isDark}
        tooltip={tooltip}
        onClick={toggle}
        data-testid={Components.NavToolbar.themeToggle}
      />
    </div>
  );
});

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    position: 'fixed',
    top: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: theme.zIndex.dropdown,
  }),
});
