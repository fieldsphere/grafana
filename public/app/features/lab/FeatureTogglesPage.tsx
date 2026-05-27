import { css } from '@emotion/css';
import { useState, useMemo } from 'react';

import { type FeatureToggles, type GrafanaTheme2, store } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Alert, Badge, FilterInput, Icon, Stack, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import config from 'app/core/config';

interface FeatureToggleRowProps {
  name: string;
  enabled: boolean;
  onToggle: (name: string, enabled: boolean) => void;
}

function FeatureToggleRow({ name, enabled, onToggle }: FeatureToggleRowProps) {
  const styles = useStyles2(getRowStyles);

  const handleToggle = () => {
    const newState = !enabled;
    onToggle(name, newState);
  };

  return (
    <tr className={styles.row}>
      <td className={styles.nameCell}>
        <code>{name}</code>
      </td>
      <td className={styles.statusCell}>
        <Badge
          text={enabled ? t('lab.feature-toggles.enabled', 'Enabled') : t('lab.feature-toggles.disabled', 'Disabled')}
          color={enabled ? 'green' : 'red'}
          icon={enabled ? 'check' : 'times'}
        />
      </td>
      <td className={styles.actionCell}>
        <button onClick={handleToggle} className={styles.toggleButton}>
          <Icon name={enabled ? 'toggle-on' : 'toggle-off'} size="xl" />
        </button>
      </td>
    </tr>
  );
}

const getRowStyles = (theme: GrafanaTheme2) => ({
  row: css({
    '&:hover': {
      backgroundColor: theme.colors.background.secondary,
    },
  }),
  nameCell: css({
    padding: theme.spacing(1, 2),
    fontFamily: theme.typography.fontFamilyMonospace,
  }),
  statusCell: css({
    padding: theme.spacing(1, 2),
    width: '120px',
  }),
  actionCell: css({
    padding: theme.spacing(1, 2),
    width: '80px',
    textAlign: 'center',
  }),
  toggleButton: css({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: theme.spacing(0.5),
    color: theme.colors.text.secondary,
    '&:hover': {
      color: theme.colors.text.primary,
    },
  }),
});

const LOCALSTORAGE_KEY = 'grafana.featureToggles';

function getLocalStorageToggles(): Record<string, boolean> {
  const stored = store.get(LOCALSTORAGE_KEY);
  if (!stored) {
    return {};
  }

  const toggles: Record<string, boolean> = {};
  stored.split(',').forEach((item: string) => {
    const [key, value] = item.split('=');
    if (key) {
      toggles[key] = value === 'true' || value === '1';
    }
  });
  return toggles;
}

function setLocalStorageToggle(name: string, enabled: boolean) {
  const toggles = getLocalStorageToggles();
  toggles[name] = enabled;

  const entries = Object.entries(toggles)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value ? '1' : '0'}`);

  if (entries.length > 0) {
    store.set(LOCALSTORAGE_KEY, entries.join(','));
  } else {
    store.delete(LOCALSTORAGE_KEY);
  }
}

export function FeatureTogglesPage() {
  const styles = useStyles2(getStyles);
  const [searchQuery, setSearchQuery] = useState('');
  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean>>(getLocalStorageToggles);

  const allToggles = useMemo(() => {
    const toggles = config.featureToggles;
    const entries: Array<{ name: string; enabled: boolean }> = [];

    for (const [name, enabled] of Object.entries(toggles)) {
      entries.push({
        name,
        enabled: localOverrides[name] !== undefined ? localOverrides[name] : Boolean(enabled),
      });
    }

    // eslint-disable-next-line @grafana/no-locale-compare -- small dataset, sorting feature toggles list
    return entries.sort((a, b) => a.name.localeCompare(b.name));
  }, [localOverrides]);

  const filteredToggles = useMemo(() => {
    if (!searchQuery) {
      return allToggles;
    }
    const query = searchQuery.toLowerCase();
    return allToggles.filter((toggle) => toggle.name.toLowerCase().includes(query));
  }, [allToggles, searchQuery]);

  const handleToggle = (name: string, enabled: boolean) => {
    setLocalStorageToggle(name, enabled);
    setLocalOverrides({ ...getLocalStorageToggles() });
  };

  const handleClearOverrides = () => {
    store.delete(LOCALSTORAGE_KEY);
    setLocalOverrides({});
  };

  const hasOverrides = Object.keys(localOverrides).length > 0;

  return (
    <Page navId="lab-feature-toggles">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Alert severity="info" title={t('lab.feature-toggles.alert-title', 'Feature Toggles')}>
            <Trans i18nKey="lab.feature-toggles.description">
              Feature toggles control experimental and preview features in Grafana. Changes made here are stored in your
              browser&apos;s local storage and will override the server configuration. Refresh the page after making
              changes to see them take effect.
            </Trans>
          </Alert>

          <div className={styles.controls}>
            <FilterInput
              placeholder={t('lab.feature-toggles.search-placeholder', 'Search feature toggles...')}
              value={searchQuery}
              onChange={setSearchQuery}
              width={40}
            />
            {hasOverrides && (
              <button onClick={handleClearOverrides} className={styles.clearButton}>
                <Icon name="times" /> {t('lab.feature-toggles.clear-overrides', 'Clear local overrides')}
              </button>
            )}
          </div>

          <div className={styles.stats}>
            <Badge text={t('lab.feature-toggles.total-count', '{{count}} toggles', { count: filteredToggles.length })} color="blue" />
            <Badge
              text={t('lab.feature-toggles.enabled-count', '{{count}} enabled', { count: filteredToggles.filter((item) => item.enabled).length })}
              color="green"
            />
            <Badge
              text={t('lab.feature-toggles.disabled-count', '{{count}} disabled', { count: filteredToggles.filter((item) => !item.enabled).length })}
              color="red"
            />
            {hasOverrides && (
              <Badge text={t('lab.feature-toggles.overrides-count', '{{count}} local overrides', { count: Object.keys(localOverrides).length })} color="orange" />
            )}
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.headerCell}>
                  <Trans i18nKey="lab.feature-toggles.column-feature">Feature Toggle</Trans>
                </th>
                <th className={styles.headerCell}>
                  <Trans i18nKey="lab.feature-toggles.column-status">Status</Trans>
                </th>
                <th className={styles.headerCell}>
                  <Trans i18nKey="lab.feature-toggles.column-toggle">Toggle</Trans>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredToggles.map((toggle) => (
                <FeatureToggleRow
                  key={toggle.name}
                  name={toggle.name}
                  enabled={toggle.enabled}
                  onToggle={handleToggle}
                />
              ))}
            </tbody>
          </table>

          {filteredToggles.length === 0 && (
            <div className={styles.noResults}>
              <Trans i18nKey="lab.feature-toggles.no-results">No feature toggles found matching your search.</Trans>
            </div>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  controls: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  }),
  clearButton: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1, 2),
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    cursor: 'pointer',
    color: theme.colors.text.secondary,
    '&:hover': {
      background: theme.colors.background.canvas,
      color: theme.colors.text.primary,
    },
  }),
  stats: css({
    display: 'flex',
    gap: theme.spacing(1),
  }),
  table: css({
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
  }),
  headerCell: css({
    padding: theme.spacing(1.5, 2),
    textAlign: 'left',
    fontWeight: theme.typography.fontWeightMedium,
    backgroundColor: theme.colors.background.secondary,
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  noResults: css({
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.colors.text.secondary,
  }),
});

export default FeatureTogglesPage;
