import { css } from '@emotion/css';
import { useCallback, useEffect, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Icon, Tooltip, useStyles2 } from '@grafana/ui';
import { changeTheme } from 'app/core/services/theme';

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system'];

interface ThemeModeToggleProps {
  className?: string;
}

function getCurrentMode(): ThemeMode {
  const currentThemeId = config.theme2.name?.toLowerCase() || '';
  if (currentThemeId.includes('light') || currentThemeId === 'solarized_light') {
    return 'light';
  }
  if (currentThemeId.includes('dark') || currentThemeId === 'solarized_dark') {
    return 'dark';
  }
  return 'system';
}

export function ThemeModeToggle({ className }: ThemeModeToggleProps) {
  const styles = useStyles2(getStyles);
  const [mode, setMode] = useState<ThemeMode>(getCurrentMode);

  useEffect(() => {
    setMode(getCurrentMode());
  }, []);

  const handleModeChange = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    changeTheme(newMode, false);
  }, []);

  const cycleMode = useCallback(() => {
    const modeOrder: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modeOrder.indexOf(mode);
    const nextMode = modeOrder[(currentIndex + 1) % modeOrder.length];
    handleModeChange(nextMode);
  }, [mode, handleModeChange]);

  const getModeIcon = (m: ThemeMode): 'lightbulb-alt' | 'circle-mono' | 'monitor' => {
    switch (m) {
      case 'light':
        return 'lightbulb-alt';
      case 'dark':
        return 'circle-mono';
      case 'system':
        return 'monitor';
    }
  };

  const getModeLabel = (m: ThemeMode) => {
    switch (m) {
      case 'light':
        return t('theme-toggle.light', 'Light mode');
      case 'dark':
        return t('theme-toggle.dark', 'Dark mode');
      case 'system':
        return t('theme-toggle.system', 'System preference');
    }
  };

  const tooltipContent = (
    <div className={styles.tooltipContent}>
      <div className={styles.tooltipTitle}>{t('theme-toggle.title', 'Theme')}</div>
      <div className={styles.tooltipCurrent}>{getModeLabel(mode)}</div>
      <div className={styles.tooltipHint}>{t('theme-toggle.hint', 'Click to change')}</div>
    </div>
  );

  return (
    <div className={className}>
      <Tooltip content={tooltipContent} placement="bottom">
        <button
          className={styles.toggleButton}
          onClick={cycleMode}
          aria-label={t('theme-toggle.aria-label', 'Toggle theme mode, current: {{mode}}', { mode: getModeLabel(mode) })}
        >
          <div className={styles.buttonContent}>
            {THEME_MODES.map((m) => (
              <div
                key={m}
                className={css(styles.modeOption, mode === m && styles.modeOptionActive)}
                aria-hidden="true"
              >
                <Icon name={getModeIcon(m)} size="sm" />
              </div>
            ))}
          </div>
        </button>
      </Tooltip>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  toggleButton: css({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.25),
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.pill,
    cursor: 'pointer',
    [theme.transitions.handleMotion('no-preference', 'reduce')]: {
      transition: 'border-color 0.2s ease',
    },
    '&:hover': {
      borderColor: theme.colors.border.medium,
    },
    '&:focus': {
      outline: 'none',
      borderColor: theme.colors.primary.border,
      boxShadow: `0 0 0 1px ${theme.colors.primary.border}`,
    },
  }),
  buttonContent: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.25),
  }),
  modeOption: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.spacing(3),
    height: theme.spacing(3),
    borderRadius: theme.shape.radius.circle,
    color: theme.colors.text.secondary,
    [theme.transitions.handleMotion('no-preference', 'reduce')]: {
      transition: 'all 0.2s ease',
    },
  }),
  modeOptionActive: css({
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.primary,
    boxShadow: theme.shadows.z1,
  }),
  tooltipContent: css({
    textAlign: 'center',
  }),
  tooltipTitle: css({
    fontWeight: theme.typography.fontWeightMedium,
    marginBottom: theme.spacing(0.5),
  }),
  tooltipCurrent: css({
    color: theme.colors.text.primary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  tooltipHint: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    marginTop: theme.spacing(0.25),
  }),
});
