import { css } from '@emotion/css';
import { useMemo, useState } from 'react';

import { type FeatureToggles, type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  FilterInput,
  RadioButtonGroup,
  Stack,
  Switch,
  Text,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import config from 'app/core/config';

import {
  getFeatureFlagRows,
  parseFeatureFlagOverrides,
  saveFeatureFlagOverrides,
  type FeatureFlagOverrides,
  type FeatureFlagRow,
} from './featureFlagOverrides';

type StatusFilter = 'all' | 'enabled' | 'disabled';

export default function FeatureFlagsDashboard() {
  const styles = useStyles2(getStyles);
  const [featureToggles, setFeatureToggles] = useState<FeatureToggles>({ ...config.featureToggles });
  const [overrides, setOverrides] = useState<FeatureFlagOverrides>(() => parseFeatureFlagOverrides());
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [hasPendingReload, setHasPendingReload] = useState(false);

  const rows = useMemo(() => getFeatureFlagRows(featureToggles, overrides), [featureToggles, overrides]);
  const filteredRows = useMemo(() => filterRows(rows, query, statusFilter), [query, rows, statusFilter]);
  const enabledCount = rows.filter((row) => row.enabled).length;
  const overrideCount = Object.keys(overrides).length;

  const updateOverride = (name: string, enabled: boolean) => {
    const nextOverrides = { ...overrides, [name]: enabled };
    const nextFeatureToggles = { ...featureToggles, [name]: enabled };

    saveFeatureFlagOverrides(nextOverrides);
    setOverrides(nextOverrides);
    setFeatureToggles(nextFeatureToggles);
    Reflect.set(config.featureToggles, name, enabled);
    setHasPendingReload(true);
  };

  const resetOverride = (name: string) => {
    const nextOverrides = { ...overrides };
    delete nextOverrides[name];

    const nextFeatureToggles = { ...featureToggles };
    if (!Reflect.get(nextFeatureToggles, name)) {
      Reflect.deleteProperty(nextFeatureToggles, name);
    }

    saveFeatureFlagOverrides(nextOverrides);
    setOverrides(nextOverrides);
    setFeatureToggles(nextFeatureToggles);
    setHasPendingReload(true);
  };

  const clearOverrides = () => {
    saveFeatureFlagOverrides({});
    setOverrides({});
    setHasPendingReload(true);
  };

  return (
    <Page
      navId="labs/feature-flags"
      pageNav={{
        id: 'labs/feature-flags',
        text: t('labs.feature-flags.title', 'Feature flags'),
        subTitle: t('labs.feature-flags.subtitle', 'View enabled feature flags and manage local browser overrides.'),
      }}
    >
      <Page.Contents>
        <Stack direction="column" gap={3}>
          <Alert severity="info" title={t('labs.feature-flags.local-overrides-title', 'Local browser controls')}>
            <Trans i18nKey="labs.feature-flags.local-overrides-description">
              Feature flag controls are saved as browser-local overrides. Reload Grafana after changing a flag so code
              that reads flags during startup can pick up the new value.
            </Trans>
          </Alert>

          {hasPendingReload && (
            <Alert
              severity="warning"
              title={t('labs.feature-flags.reload-title', 'Reload needed')}
              onRemove={() => setHasPendingReload(false)}
              action={
                <Button variant="secondary" onClick={() => window.location.reload()}>
                  <Trans i18nKey="labs.feature-flags.reload-button">Reload now</Trans>
                </Button>
              }
            >
              <Trans i18nKey="labs.feature-flags.reload-description">
                Your changes were saved. Reload Grafana to apply them everywhere.
              </Trans>
            </Alert>
          )}

          <div className={styles.summaryGrid}>
            <SummaryCard
              label={t('labs.feature-flags.enabled-count', 'Enabled flags')}
              value={enabledCount}
              description={t('labs.feature-flags.enabled-description', 'Active in this browser right now')}
            />
            <SummaryCard
              label={t('labs.feature-flags.override-count', 'Local overrides')}
              value={overrideCount}
              description={t('labs.feature-flags.override-description', 'Saved in local browser storage')}
            />
            <SummaryCard
              label={t('labs.feature-flags.showing-count', 'Showing')}
              value={filteredRows.length}
              description={t('labs.feature-flags.showing-description', 'Flags matching the current filters')}
            />
          </div>

          <div className={styles.toolbar}>
            <FilterInput
              className={styles.search}
              value={query}
              escapeRegex={false}
              onChange={setQuery}
              placeholder={t('labs.feature-flags.search-placeholder', 'Search feature flags')}
            />
            <RadioButtonGroup<StatusFilter>
              aria-label={t('labs.feature-flags.status-filter-label', 'Feature flag status filter')}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                {
                  label: t('labs.feature-flags.filter-all', 'All'),
                  value: 'all',
                  ariaLabel: t('labs.feature-flags.filter-all-aria', 'All feature flags'),
                },
                {
                  label: t('labs.feature-flags.filter-enabled', 'Enabled'),
                  value: 'enabled',
                  ariaLabel: t('labs.feature-flags.filter-enabled-aria', 'Enabled feature flags'),
                },
                {
                  label: t('labs.feature-flags.filter-disabled', 'Disabled'),
                  value: 'disabled',
                  ariaLabel: t('labs.feature-flags.filter-disabled-aria', 'Disabled feature flags'),
                },
              ]}
            />
            {overrideCount > 0 && (
              <Button variant="secondary" onClick={clearOverrides}>
                <Trans i18nKey="labs.feature-flags.clear-overrides">Clear local overrides</Trans>
              </Button>
            )}
          </div>

          {filteredRows.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>
                      <Trans i18nKey="labs.feature-flags.table.flag">Flag</Trans>
                    </th>
                    <th>
                      <Trans i18nKey="labs.feature-flags.table.source">Source</Trans>
                    </th>
                    <th>
                      <Trans i18nKey="labs.feature-flags.table.state">State</Trans>
                    </th>
                    <th>
                      <Trans i18nKey="labs.feature-flags.table.control">Control</Trans>
                    </th>
                    <th>
                      <Trans i18nKey="labs.feature-flags.table.actions">Actions</Trans>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <FeatureFlagTableRow
                      key={row.name}
                      row={row}
                      hasOverride={Object.prototype.hasOwnProperty.call(overrides, row.name)}
                      onToggle={updateOverride}
                      onReset={resetOverride}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState variant="not-found" message={t('labs.feature-flags.empty-title', 'No feature flags found')}>
              <Trans i18nKey="labs.feature-flags.empty-description">Try adjusting your search or status filter.</Trans>
            </EmptyState>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

function SummaryCard({ label, value, description }: { label: string; value: number; description: string }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.summaryCard}>
      <Text element="p" color="secondary">
        {label}
      </Text>
      <div className={styles.summaryValue}>{value}</div>
      <Text element="p" color="secondary">
        {description}
      </Text>
    </div>
  );
}

function FeatureFlagTableRow({
  row,
  hasOverride,
  onToggle,
  onReset,
}: {
  row: FeatureFlagRow;
  hasOverride: boolean;
  onToggle: (name: string, enabled: boolean) => void;
  onReset: (name: string) => void;
}) {
  return (
    <tr>
      <td>
        <code>{row.name}</code>
      </td>
      <td>
        {row.source === 'local' ? (
          <Badge color="purple" text={t('labs.feature-flags.source-local', 'Local override')} />
        ) : (
          <Badge color="blue" text={t('labs.feature-flags.source-server', 'Server config')} />
        )}
      </td>
      <td>
        {row.enabled ? (
          <Badge color="green" icon="check" text={t('labs.feature-flags.state-enabled', 'Enabled')} />
        ) : (
          <Badge color="orange" text={t('labs.feature-flags.state-disabled', 'Disabled')} />
        )}
      </td>
      <td>
        <Switch
          label={t('labs.feature-flags.toggle-label', 'Set {{name}} feature flag', { name: row.name })}
          value={row.enabled}
          onChange={(event) => onToggle(row.name, event.currentTarget.checked)}
        />
      </td>
      <td>
        <Button size="sm" variant="secondary" disabled={!hasOverride} onClick={() => onReset(row.name)}>
          <Trans i18nKey="labs.feature-flags.reset">Reset</Trans>
        </Button>
      </td>
    </tr>
  );
}

function filterRows(rows: FeatureFlagRow[], query: string, statusFilter: StatusFilter) {
  const normalizedQuery = query.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesQuery = normalizedQuery ? row.name.toLowerCase().includes(normalizedQuery) : true;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'enabled' ? row.enabled : !row.enabled);

    return matchesQuery && matchesStatus;
  });
}

const getStyles = (theme: GrafanaTheme2) => ({
  summaryGrid: css({
    display: 'grid',
    gap: theme.spacing(2),
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  }),
  summaryCard: css({
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
  }),
  summaryValue: css({
    color: theme.colors.text.primary,
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: theme.typography.h2.lineHeight,
    margin: theme.spacing(0.5, 0),
  }),
  toolbar: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  }),
  search: css({
    minWidth: theme.spacing(32),
  }),
  tableWrap: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    overflowX: 'auto',
  }),
  table: css({
    borderCollapse: 'collapse',
    width: '100%',

    'th, td': {
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      padding: theme.spacing(1.5, 2),
      textAlign: 'left',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap',
    },

    th: {
      background: theme.colors.background.secondary,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeightMedium,
    },

    'tbody tr:last-child td': {
      borderBottom: 0,
    },
  }),
});
