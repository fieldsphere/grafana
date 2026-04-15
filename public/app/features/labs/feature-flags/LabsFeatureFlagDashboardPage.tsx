import { css } from '@emotion/css';
import { useMemo, useState } from 'react';

import { type FeatureToggles, type GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import config from 'app/core/config';
import { Page } from 'app/core/components/Page/Page';
import {
  Badge,
  Box,
  Button,
  InlineField,
  InlineFieldRow,
  InlineSwitch,
  Input,
  Stack,
  Text,
  useStyles2,
} from '@grafana/ui';

type FeatureFlagEntry = {
  name: string;
  enabled: boolean;
};

function getInitialFeatureFlags(): FeatureFlagEntry[] {
  return Object.entries(config.featureToggles as FeatureToggles)
    .filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
    .map(([name, enabled]) => ({
      name,
      enabled,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function LabsFeatureFlagDashboardPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<FeatureFlagEntry[]>(() => getInitialFeatureFlags());

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return entries;
    }

    return entries.filter((entry) => entry.name.toLowerCase().includes(normalizedQuery));
  }, [entries, query]);

  const enabledCount = entries.filter((entry) => entry.enabled).length;
  const disabledCount = entries.length - enabledCount;
  const visibleEnabledCount = filteredEntries.filter((entry) => entry.enabled).length;
  const visibleDisabledCount = filteredEntries.length - visibleEnabledCount;

  const onToggle = (name: string, enabled: boolean) => {
    config.featureToggles[name as keyof FeatureToggles] = enabled;
    setEntries((current) => current.map((entry) => (entry.name === name ? { ...entry, enabled } : entry)));
  };

  const onReset = () => {
    const nextEntries = getInitialFeatureFlags();
    setEntries(nextEntries);
    for (const entry of nextEntries) {
      config.featureToggles[entry.name as keyof FeatureToggles] = entry.enabled;
    }
  };

  return (
    <Page navId="labs-feature-flags">
      <Page.Contents>
        <div className={styles.header}>
          <h1>{t('labs.feature-flags.title', 'Feature flagging dashboard')}</h1>
          <p className={styles.subtitle}>
            {t(
              'labs.feature-flags.subtitle',
              'See which feature flags are enabled and control them in this browser session.'
            )}
          </p>
          <p className={styles.titleBadgeRow}>
            <Badge text={t('labs.feature-flags.badge', 'New')} color="blue" />
          </p>
          <Stack direction="row" alignItems="center" gap={1}>
            <Badge text={`${enabledCount} enabled`} color="green" />
            <Badge text={`${disabledCount} disabled`} color="orange" />
          </Stack>
        </div>

        <InlineFieldRow className={styles.controls}>
          <InlineField
            label={t('labs.feature-flags.search-label', 'Filter flags')}
            labelWidth={20}
            className={styles.searchField}
          >
            <Input
              value={query}
              width={50}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder={t('labs.feature-flags.search-placeholder', 'Search by flag name')}
            />
          </InlineField>
          <Button variant="secondary" onClick={onReset}>
            {t('labs.feature-flags.reset-button', 'Reset visible state')}
          </Button>
        </InlineFieldRow>

        <div className={styles.list}>
          <div className={styles.listHeader}>
            <Text variant="bodySmall" color="secondary">
              {t(
                'labs.feature-flags.visible-summary',
                'Showing {{count}} flags ({{enabled}} enabled, {{disabled}} disabled)',
                {
                  count: filteredEntries.length,
                  enabled: visibleEnabledCount,
                  disabled: visibleDisabledCount,
                }
              )}
            </Text>
          </div>
          {filteredEntries.map((entry) => (
            <div key={entry.name} className={styles.row}>
              <div className={styles.flagInfo}>
                <code className={styles.flagName}>{entry.name}</code>
                <span className={styles.flagState}>
                  {entry.enabled
                    ? t('labs.feature-flags.state.enabled', 'Enabled')
                    : t('labs.feature-flags.state.disabled', 'Disabled')}
                </span>
              </div>
              <div className={styles.switchControl}>
                <Text variant="bodySmall" color="secondary">
                  {t('labs.feature-flags.controls.note', 'Control this flag in-app')}
                </Text>
                <InlineSwitch
                  id={`labs-feature-flag-${entry.name}`}
                  value={entry.enabled}
                  onChange={(event) => onToggle(entry.name, event.currentTarget.checked)}
                />
              </div>
            </div>
          ))}

          {filteredEntries.length === 0 && (
            <p className={styles.emptyState}>
              {t('labs.feature-flags.no-results', 'No feature flags matched your filter.')}
            </p>
          )}
        </div>
        <Box marginTop={2}>
          <Text variant="bodySmall" color="secondary">
            {t(
              'labs.feature-flags.scope-note',
              'These controls update runtime flags for your current browser session. Refreshing the page rehydrates from server-provided settings.'
            )}
          </Text>
        </Box>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  header: css({
    marginBottom: theme.spacing(3),
  }),
  subtitle: css({
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing(2),
  }),
  titleBadgeRow: css({
    marginBottom: theme.spacing(1),
  }),
  controls: css({
    alignItems: 'flex-end',
    marginBottom: theme.spacing(2),
  }),
  searchField: css({
    maxWidth: theme.spacing(80),
  }),
  list: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    overflow: 'hidden',
  }),
  listHeader: css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(1, 2),
  }),
  row: css({
    alignItems: 'center',
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(1.5, 2),
    '&:last-child': {
      borderBottom: 'none',
    },
  }),
  flagInfo: css({
    alignItems: 'baseline',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  flagName: css({
    fontSize: theme.typography.body.fontSize,
  }),
  flagState: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  switchControl: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
  }),
  emptyState: css({
    color: theme.colors.text.secondary,
    margin: 0,
    padding: theme.spacing(2),
  }),
});
