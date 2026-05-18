import { memo, useCallback } from 'react';

import { Components } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import { reportInteraction } from '@grafana/runtime';
import { InlineSwitch, Stack, useTheme2 } from '@grafana/ui';
import { useMediaQueryMinWidth } from 'app/core/hooks/useMediaQueryMinWidth';
import { toggleTheme } from 'app/core/services/theme';

export const ThemeToolbarToggle = memo(function ThemeToolbarToggle() {
  const theme = useTheme2();
  const isLargeScreen = useMediaQueryMinWidth('sm');

  const onToggle = useCallback(() => {
    reportInteraction('grafana_preferences_theme_changed', {
      toTheme: theme.isDark ? 'light' : 'dark',
      preferenceType: 'toolbar_toggle',
    });
    void toggleTheme(false);
  }, [theme.isDark]);

  const label = t('navigation.theme.dark-interface-label', 'Dark interface');

  return (
    <Stack alignItems="center" data-testid={Components.NavToolbar.themeToggle}>
      <InlineSwitch
        transparent
        id="toolbar-theme-toggle"
        value={theme.isDark}
        onChange={onToggle}
        showLabel={isLargeScreen}
        label={label}
      />
    </Stack>
  );
});
