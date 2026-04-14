import { css } from '@emotion/css';
import { useEffect, useState } from 'react';

import { type GrafanaTheme2, type SelectableValue } from '@grafana/data';
import { t } from '@grafana/i18n';
import { config, reportInteraction } from '@grafana/runtime';
import { RadioButtonGroup, useStyles2 } from '@grafana/ui';
import { changeTheme } from 'app/core/services/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface Props {
  className?: string;
}

export function ThemeModeToggle({ className }: Props) {
  const styles = useStyles2(getStyles);
  const [currentMode, setCurrentMode] = useState<ThemeMode>(getInitialMode());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = () => {
      if (currentMode === 'system') {
        changeTheme('system', true);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [currentMode]);

  const options: Array<SelectableValue<ThemeMode>> = [
    {
      value: 'light',
      icon: 'sun',
      ariaLabel: t('theme-mode-toggle.light', 'Light mode'),
    },
    {
      value: 'dark',
      icon: 'moon',
      ariaLabel: t('theme-mode-toggle.dark', 'Dark mode'),
    },
    {
      value: 'system',
      icon: 'monitor',
      ariaLabel: t('theme-mode-toggle.system', 'System preference'),
    },
  ];

  const handleModeChange = (mode: ThemeMode) => {
    setCurrentMode(mode);
    reportInteraction('grafana_theme_mode_changed', {
      toMode: mode,
    });
    changeTheme(mode, false);
  };

  return (
    <div className={className}>
      <RadioButtonGroup
        options={options}
        value={currentMode}
        onChange={handleModeChange}
        size="sm"
        className={styles.toggle}
        aria-label={t('theme-mode-toggle.aria-label', 'Theme mode')}
      />
    </div>
  );
}

function getInitialMode(): ThemeMode {
  const currentTheme = config.theme2;
  const themeName = currentTheme.name.toLowerCase();

  if (themeName === 'system preference' || themeName === 'system') {
    return 'system';
  }
  if (themeName === 'light') {
    return 'light';
  }
  if (themeName === 'dark') {
    return 'dark';
  }

  return currentTheme.isDark ? 'dark' : 'light';
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    toggle: css({
      justifyContent: 'center',
    }),
  };
};
