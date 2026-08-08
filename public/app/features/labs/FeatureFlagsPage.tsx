import { css } from '@emotion/css';
import { type ChangeEvent, useMemo, useRef, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Alert, Badge, Button, EmptyState, FilterInput, Stack, Switch, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import config from 'app/core/config';

import {
  getFeatureToggleRows,
  getStoredFeatureToggleOverrides,
  setStoredFeatureToggleOverrides,
  type FeatureToggleOverrides,
} from './featureFlagOverrides';

const applyRuntimeToggle = (name: string, enabled: boolean) => {
  Object.assign(config.featureToggles, { [name]: enabled });
};

const getInitialFeatureToggles = () => {
  return Object.fromEntries(Object.entries(config.featureToggles).map(([name, enabled]) => [name, enabled === true]));
};

export default function FeatureFlagsPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const [filterResetKey, setFilterResetKey] = useState(0);
  const [overrides, setOverrides] = useState<FeatureToggleOverrides>(() => getStoredFeatureToggleOverrides());
  const initialFeatureToggles = useRef(getInitialFeatureToggles());
  const featureToggles = config.featureToggles;
  const rows = useMemo(() => getFeatureToggleRows(featureToggles, overrides), [featureToggles, overrides]);
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return rows;
    }

    return rows.filter((row) => row.name.toLowerCase().includes(normalizedQuery));
  }, [query, rows]);
  const overrideCount = rows.filter((row) => row.hasOverride).length;
  const summary =
    overrideCount === 1
      ? t(
          'labs.feature-flags.summary-singular-override',
          'Showing {{visible}} of {{total}} enabled feature flags. 1 local override active.',
          { visible: filteredRows.length, total: rows.length }
        )
      : t(
          'labs.feature-flags.summary',
          'Showing {{visible}} of {{total}} enabled feature flags. {{overrides}} local overrides active.',
          { visible: filteredRows.length, total: rows.length, overrides: overrideCount }
        );

  const setFeatureEnabled = (name: string, enabled: boolean) => {
    const nextOverrides = { ...overrides, [name]: enabled };
    setStoredFeatureToggleOverrides(nextOverrides);
    setOverrides(nextOverrides);
    applyRuntimeToggle(name, enabled);
  };

  const clearOverrides = () => {
    setStoredFeatureToggleOverrides({});
    setOverrides({});
    setQuery('');
    setFilterResetKey((key) => key + 1);
    for (const row of rows) {
      applyRuntimeToggle(row.name, Boolean(initialFeatureToggles.current[row.name]));
    }
  };

  return (
    <Page
      navId="labs/feature-flags"
      subTitle={t(
        'labs.feature-flags.subtitle',
        'View enabled feature flags and control local overrides in this browser.'
      )}
    >
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Alert severity="info" title={t('labs.feature-flags.local-overrides.title', 'Local browser overrides')}>
            <Trans i18nKey="labs.feature-flags.local-overrides.description">
              Changes are saved to this browser and applied immediately to Grafana&apos;s frontend feature toggle
              config. Reload Grafana after changing a flag to ensure every feature reads the new value.
            </Trans>
          </Alert>

          <div className={styles.toolbar}>
            <FilterInput
              key={filterResetKey}
              value={query}
              onChange={setQuery}
              placeholder={t('labs.feature-flags.search.placeholder', 'Search feature flags')}
              escapeRegex={false}
            />
            <Button variant="secondary" disabled={overrideCount === 0} onClick={clearOverrides}>
              <Trans i18nKey="labs.feature-flags.clear-overrides">Clear local overrides</Trans>
            </Button>
          </div>

          <Text color="secondary">{summary}</Text>

          {rows.length === 0 ? (
            <EmptyState message={t('labs.feature-flags.empty', 'No enabled feature flags found')} variant="not-found" />
          ) : (
            <div className={styles.tableWrapper}>
              <table className="filter-table" data-testid="labs-feature-flags-table">
                <thead>
                  <tr>
                    <th>
                      <Trans i18nKey="labs.feature-flags.table.flag">Feature flag</Trans>
                    </th>
                    <th>
                      <Trans i18nKey="labs.feature-flags.table.state">State</Trans>
                    </th>
                    <th>
                      <Trans i18nKey="labs.feature-flags.table.source">Source</Trans>
                    </th>
                    <th className={styles.controlHeader}>
                      <Trans i18nKey="labs.feature-flags.table.control">Control</Trans>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.name}>
                      <td>
                        <Text variant="code">{row.name}</Text>
                      </td>
                      <td>
                        <Badge
                          color={row.enabled ? 'green' : 'red'}
                          text={
                            row.enabled
                              ? t('labs.feature-flags.state.enabled', 'Enabled')
                              : t('labs.feature-flags.state.disabled', 'Disabled')
                          }
                        />
                      </td>
                      <td>
                        <Badge
                          color={row.hasOverride ? 'orange' : 'blue'}
                          text={
                            row.hasOverride
                              ? t('labs.feature-flags.source.local-override', 'Local override')
                              : t('labs.feature-flags.source.server-config', 'Server config')
                          }
                        />
                      </td>
                      <td className={styles.controlCell}>
                        <Switch
                          id={`labs-feature-flag-${row.name}`}
                          value={row.enabled}
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setFeatureEnabled(row.name, event.currentTarget.checked)
                          }
                          aria-label={t('labs.feature-flags.toggle.label', 'Toggle {{flag}}', { flag: row.name })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRows.length === 0 && (
                <EmptyState
                  message={t('labs.feature-flags.no-results', 'No feature flags match your search')}
                  variant="not-found"
                />
              )}
            </div>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  toolbar: css({
    display: 'flex',
    gap: theme.spacing(1),
    justifyContent: 'space-between',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      alignItems: 'stretch',
      flexDirection: 'column',
    },
  }),
  tableWrapper: css({
    overflowX: 'auto',
  }),
  controlHeader: css({
    textAlign: 'right',
  }),
  controlCell: css({
    textAlign: 'right',
  }),
});
