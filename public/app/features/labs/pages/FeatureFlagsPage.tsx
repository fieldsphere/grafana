import { css } from '@emotion/css';
import { useMemo, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Alert, Badge, Button, Input, Stack, Switch, Text, useStyles2 } from '@grafana/ui';
import config from 'app/core/config';
import { Page } from 'app/core/components/Page/Page';

import {
  getFeatureToggleRows,
  readFeatureToggleOverrides,
  writeFeatureToggleOverrides,
  type FeatureToggleRow,
} from '../utils';

export default function FeatureFlagsPage() {
  return (
    <Page navId="labs/feature-flags">
      <Page.Contents>
        <FeatureFlagsPageContent />
      </Page.Contents>
    </Page>
  );
}

export function FeatureFlagsPageContent() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const [overrides, setOverrides] = useState(() => readFeatureToggleOverrides());

  const rows = useMemo(() => getFeatureToggleRows(config.featureToggles, overrides), [overrides]);
  const filteredRows = rows.filter((row) => row.name.toLowerCase().includes(query.toLowerCase()));
  const activeCount = rows.filter((row) => row.enabled).length;
  const overrideCount = Object.keys(overrides).length;

  const updateFeatureToggle = (row: FeatureToggleRow, enabled: boolean) => {
    const nextOverrides = {
      ...overrides,
      [row.name]: enabled,
    };
    (config.featureToggles as Record<string, boolean>)[row.name] = enabled;
    writeFeatureToggleOverrides(nextOverrides);
    setOverrides(nextOverrides);
  };

  const resetOverrides = () => {
    writeFeatureToggleOverrides({});
    window.location.reload();
  };

  return (
    <div className={styles.wrapper} data-testid="feature-flags-dashboard">
      <Alert severity="info" title={t('labs.feature-flags.info-title', 'Local feature flag controls')}>
        <Trans i18nKey="labs.feature-flags.info-body">
          Feature flag changes are saved as local browser overrides. Reload Grafana after changing a flag so boot-time
          feature checks pick up the new values.
        </Trans>
      </Alert>

      <Stack direction="row" gap={2} alignItems="center" wrap="wrap">
        <Badge color="green" text={t('labs.feature-flags.active-count', '{{activeCount}} active', { activeCount })} />
        <Badge
          color={overrideCount > 0 ? 'orange' : 'blue'}
          text={t('labs.feature-flags.override-count', '{{overrideCount}} local overrides', { overrideCount })}
        />
      </Stack>

      <div className={styles.toolbar}>
        <Input
          aria-label={t('labs.feature-flags.search-label', 'Search feature flags')}
          placeholder={t('labs.feature-flags.search-placeholder', 'Search feature flags')}
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <Stack direction="row" gap={1}>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            <Trans i18nKey="labs.feature-flags.reload">Reload Grafana</Trans>
          </Button>
          <Button variant="destructive" onClick={resetOverrides} disabled={overrideCount === 0}>
            <Trans i18nKey="labs.feature-flags.reset">Reset overrides</Trans>
          </Button>
        </Stack>
      </div>

      {filteredRows.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className="filter-table">
            <thead>
              <tr>
                <th>
                  <Trans i18nKey="labs.feature-flags.flag">Flag</Trans>
                </th>
                <th>
                  <Trans i18nKey="labs.feature-flags.status">Status</Trans>
                </th>
                <th>
                  <Trans i18nKey="labs.feature-flags.source">Source</Trans>
                </th>
                <th className={styles.controlHeader}>
                  <Trans i18nKey="labs.feature-flags.control">Control</Trans>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.name}>
                  <td>
                    <Text weight="medium">{row.name}</Text>
                  </td>
                  <td>
                    <Badge
                      color={row.enabled ? 'green' : 'red'}
                      text={
                        row.enabled
                          ? t('labs.feature-flags.enabled', 'Enabled')
                          : t('labs.feature-flags.disabled', 'Disabled')
                      }
                    />
                  </td>
                  <td>
                    {row.isOverridden ? (
                      <Badge color="orange" text={t('labs.feature-flags.local-override', 'Local override')} />
                    ) : (
                      <Text color="secondary">
                        <Trans i18nKey="labs.feature-flags.server">Server</Trans>
                      </Text>
                    )}
                  </td>
                  <td className={styles.controlCell}>
                    <Switch
                      aria-label={t('labs.feature-flags.toggle-label', 'Toggle {{name}}', { name: row.name })}
                      value={row.enabled}
                      onChange={(event) => updateFeatureToggle(row, event.currentTarget.checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Text color="secondary">
            <Trans i18nKey="labs.feature-flags.empty">No enabled feature flags match your search.</Trans>
          </Text>
        </div>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  toolbar: css({
    display: 'grid',
    gap: theme.spacing(1),
    gridTemplateColumns: '1fr',

    [theme.breakpoints.up('md')]: {
      alignItems: 'center',
      gridTemplateColumns: 'minmax(260px, 420px) auto',
      justifyContent: 'space-between',
    },
  }),
  tableWrap: css({
    overflowX: 'auto',
  }),
  controlHeader: css({
    textAlign: 'right',
  }),
  controlCell: css({
    textAlign: 'right',
  }),
  emptyState: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(3),
  }),
});
