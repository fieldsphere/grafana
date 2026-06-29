import { css } from '@emotion/css';
import { type FormEvent, useMemo, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Alert, Badge, Button, Field, FilterInput, Input, Stack, Switch, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import config from 'app/core/config';

import {
  getFeatureToggleOverrides,
  removeFeatureToggleOverride,
  saveFeatureToggleOverrides,
  setFeatureToggleOverride,
  type FeatureToggleOverrides,
} from '../featureToggleOverrides';

interface FeatureFlagRow {
  name: string;
  serverEnabled: boolean;
  enabled: boolean;
  hasOverride: boolean;
}

const FEATURE_FLAG_NAME_PATTERN = /^[A-Za-z0-9_.-]+$/;
const featureToggleNameCollator = new Intl.Collator(undefined, { sensitivity: 'base' });

export default function FeatureFlagsPage() {
  const styles = useStyles2(getStyles);
  const [overrides, setOverrides] = useState<FeatureToggleOverrides>(() => getFeatureToggleOverrides());
  const [query, setQuery] = useState('');
  const [newFlagName, setNewFlagName] = useState('');
  const [showReloadNotice, setShowReloadNotice] = useState(false);

  const rows = useMemo(() => {
    const serverEnabledFlags = Object.entries(config.featureToggles)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([name]) => name);
    const flagNames = new Set([...serverEnabledFlags, ...Object.keys(overrides)]);

    return Array.from(flagNames)
      .map((name): FeatureFlagRow => {
        const serverEnabled = serverEnabledFlags.includes(name);
        const hasOverride = Object.prototype.hasOwnProperty.call(overrides, name);

        return {
          name,
          serverEnabled,
          enabled: hasOverride ? overrides[name] : serverEnabled,
          hasOverride,
        };
      })
      .filter((row) => row.name.toLowerCase().includes(query.toLowerCase()))
      .sort((first, second) => featureToggleNameCollator.compare(first.name, second.name));
  }, [overrides, query]);

  const enabledCount = rows.filter((row) => row.enabled).length;
  const overrideCount = Object.keys(overrides).length;

  const updateOverride = (name: string, enabled: boolean) => {
    setFeatureToggleOverride(name, enabled);
    setOverrides(getFeatureToggleOverrides());
    setShowReloadNotice(true);
  };

  const resetOverride = (name: string) => {
    removeFeatureToggleOverride(name);
    setOverrides(getFeatureToggleOverrides());
    setShowReloadNotice(true);
  };

  const resetAllOverrides = () => {
    saveFeatureToggleOverrides({});
    setOverrides({});
    setShowReloadNotice(true);
  };

  const addOverride = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newFlagName.trim();
    if (!isValidFeatureFlagName(trimmedName)) {
      return;
    }

    updateOverride(trimmedName, true);
    setNewFlagName('');
  };

  return (
    <Page navId="labs/feature-flags">
      <Page.Contents>
        <Stack direction="column" gap={3}>
          <div>
            <h2 className={styles.title}>{t('labs.feature-flags.title', 'Feature flags')}</h2>
            <p className={styles.description}>
              <Trans i18nKey="labs.feature-flags.description">
                View feature flags enabled for this Grafana instance and control browser-local overrides.
              </Trans>
            </p>
          </div>

          <Alert severity="info" title={t('labs.feature-flags.local-overrides-title', 'Local browser overrides')}>
            <Trans i18nKey="labs.feature-flags.local-overrides-description">
              Changes are saved in this browser using grafana.featureToggles and apply after a reload.
            </Trans>
          </Alert>

          {showReloadNotice && (
            <Alert severity="success" title={t('labs.feature-flags.reload-title', 'Feature flag override saved')}>
              <Stack direction="row" alignItems="center" gap={2}>
                <span>
                  <Trans i18nKey="labs.feature-flags.reload-description">
                    Reload Grafana to apply this override across the app.
                  </Trans>
                </span>
                <Button size="sm" onClick={() => window.location.reload()}>
                  <Trans i18nKey="labs.feature-flags.reload-action">Reload now</Trans>
                </Button>
              </Stack>
            </Alert>
          )}

          <section
            className={styles.summaryGrid}
            aria-label={t('labs.feature-flags.summary-label', 'Feature flag summary')}
          >
            <SummaryCard label={t('labs.feature-flags.enabled-count', 'Enabled flags')} value={enabledCount} />
            <SummaryCard label={t('labs.feature-flags.override-count', 'Local overrides')} value={overrideCount} />
            <SummaryCard label={t('labs.feature-flags.total-count', 'Visible flags')} value={rows.length} />
          </section>

          <form className={styles.addOverrideForm} onSubmit={addOverride}>
            <Field
              label={t('labs.feature-flags.add-override-label', 'Add a flag override')}
              description={t(
                'labs.feature-flags.add-override-description',
                'Use this for a known feature flag that is not currently enabled by the server.'
              )}
              invalid={newFlagName.length > 0 && !isValidFeatureFlagName(newFlagName.trim())}
              error={t('labs.feature-flags.add-override-error', 'Use letters, numbers, underscore, dash, or dot.')}
              noMargin
            >
              <Input
                value={newFlagName}
                onChange={(event) => setNewFlagName(event.currentTarget.value)}
                placeholder={t('labs.feature-flags.add-override-placeholder', 'featureFlagName')}
                data-testid="labs-feature-flags-add-input"
              />
            </Field>
            <Button type="submit" disabled={!isValidFeatureFlagName(newFlagName.trim())}>
              <Trans i18nKey="labs.feature-flags.add-override-action">Enable override</Trans>
            </Button>
          </form>

          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} wrap>
            <div className={styles.filterInput}>
              <FilterInput
                value={query}
                onChange={setQuery}
                placeholder={t('labs.feature-flags.filter-placeholder', 'Search feature flags')}
                escapeRegex={false}
                width={0}
              />
            </div>
            <Button variant="secondary" fill="outline" onClick={resetAllOverrides} disabled={overrideCount === 0}>
              <Trans i18nKey="labs.feature-flags.reset-all">Reset all overrides</Trans>
            </Button>
          </Stack>

          <div className={styles.tableWrapper}>
            <table className={styles.table} data-testid="labs-feature-flags-table">
              <thead>
                <tr>
                  <th>{t('labs.feature-flags.column-name', 'Feature flag')}</th>
                  <th>{t('labs.feature-flags.column-source', 'Source')}</th>
                  <th>{t('labs.feature-flags.column-status', 'Status')}</th>
                  <th>{t('labs.feature-flags.column-control', 'Control')}</th>
                  <th>{t('labs.feature-flags.column-actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.name}>
                    <td>
                      <code>{row.name}</code>
                    </td>
                    <td>
                      <Badge
                        color={row.hasOverride ? 'purple' : 'blue'}
                        text={
                          row.hasOverride
                            ? t('labs.feature-flags.source-override', 'Local override')
                            : t('labs.feature-flags.source-server', 'Server enabled')
                        }
                      />
                    </td>
                    <td>
                      <Badge
                        color={row.enabled ? 'green' : 'darkgrey'}
                        text={
                          row.enabled
                            ? t('labs.feature-flags.status-enabled', 'Enabled')
                            : t('labs.feature-flags.status-disabled', 'Disabled')
                        }
                      />
                    </td>
                    <td>
                      <Switch
                        value={row.enabled}
                        label={t('labs.feature-flags.toggle-label', 'Toggle {{name}}', { name: row.name })}
                        onChange={(event) => updateOverride(row.name, event.currentTarget.checked)}
                      />
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="secondary"
                        fill="outline"
                        onClick={() => resetOverride(row.name)}
                        disabled={!row.hasOverride}
                      >
                        <Trans i18nKey="labs.feature-flags.reset-row">Reset</Trans>
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.emptyCell}>
                      <Trans i18nKey="labs.feature-flags.empty">No feature flags match this search.</Trans>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Stack>
      </Page.Contents>
    </Page>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryValue}>{value}</div>
      <div className={styles.summaryLabel}>{label}</div>
    </div>
  );
}

function isValidFeatureFlagName(name: string) {
  return FEATURE_FLAG_NAME_PATTERN.test(name);
}

const getStyles = (theme: GrafanaTheme2) => ({
  title: css({
    margin: 0,
  }),
  description: css({
    color: theme.colors.text.secondary,
    margin: theme.spacing(1, 0, 0),
  }),
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
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: 1,
  }),
  summaryLabel: css({
    color: theme.colors.text.secondary,
    marginTop: theme.spacing(1),
  }),
  addOverrideForm: css({
    alignItems: 'flex-end',
    display: 'grid',
    gap: theme.spacing(2),
    gridTemplateColumns: 'minmax(240px, 420px) max-content',

    [theme.breakpoints.down('sm')]: {
      alignItems: 'stretch',
      gridTemplateColumns: '1fr',
    },
  }),
  filterInput: css({
    flex: '1 1 280px',
    maxWidth: 480,
  }),
  tableWrapper: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    overflowX: 'auto',
  }),
  table: css({
    borderCollapse: 'collapse',
    width: '100%',

    th: {
      background: theme.colors.background.secondary,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeightMedium,
      textAlign: 'left',
    },

    'th, td': {
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      padding: theme.spacing(1.5, 2),
      verticalAlign: 'middle',
      whiteSpace: 'nowrap',
    },

    'tbody tr:last-child td': {
      borderBottom: 0,
    },
  }),
  emptyCell: css({
    color: theme.colors.text.secondary,
    textAlign: 'center',
  }),
});
