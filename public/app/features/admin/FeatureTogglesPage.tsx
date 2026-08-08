import { css } from '@emotion/css';
import { type ChangeEvent, useMemo, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Alert, Button, FilterInput, InlineSwitch, RadioButtonGroup, Stack, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import {
  FEATURE_TOGGLE_LOCAL_STORAGE_KEY,
  type FeatureToggleName,
  type OverrideMap,
  applyFeatureToggleOverride,
  getFeatureToggleRows,
  parseFeatureToggleOverrides,
  writeFeatureToggleOverrides,
} from './featureToggles';

type Filter = 'all' | 'enabled' | 'disabled' | 'overridden';

function readOverrides(): OverrideMap {
  return parseFeatureToggleOverrides(window.localStorage.getItem(FEATURE_TOGGLE_LOCAL_STORAGE_KEY));
}

export default function FeatureTogglesPage() {
  const styles = useStyles2(getStyles);
  const [overrides, setOverrides] = useState<OverrideMap>(() => readOverrides());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [hasPendingReload, setHasPendingReload] = useState(false);

  const rows = useMemo(() => getFeatureToggleRows(config.featureToggles, overrides), [overrides]);
  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery = normalizedQuery === '' || row.name.toLowerCase().includes(normalizedQuery);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'enabled' && row.enabled) ||
        (filter === 'disabled' && !row.enabled) ||
        (filter === 'overridden' && row.hasOverride);

      return matchesQuery && matchesFilter;
    });
  }, [filter, query, rows]);

  const updateOverride = (name: FeatureToggleName, enabled: boolean) => {
    const nextOverrides = { ...overrides, [name]: enabled };
    writeFeatureToggleOverrides(nextOverrides);
    setOverrides(nextOverrides);
    applyFeatureToggleOverride(name, enabled);
    setHasPendingReload(true);
  };

  const removeOverride = (name: FeatureToggleName) => {
    const nextOverrides = { ...overrides };
    delete nextOverrides[name];
    writeFeatureToggleOverrides(nextOverrides);
    setOverrides(nextOverrides);
    window.location.reload();
  };

  const resetOverrides = () => {
    writeFeatureToggleOverrides({});
    setOverrides({});
    window.location.reload();
  };

  return (
    <Page navId="feature-toggles">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Alert severity="info" title={t('admin.feature-toggles-page.info-title', 'Browser-only dev mode')}>
            <Trans i18nKey="admin.feature-toggles-page.info-description">
              Toggle feature flags for this browser by writing overrides to localStorage. These overrides are intended
              for development and debugging; they do not change Grafana server configuration.
            </Trans>
          </Alert>

          {hasPendingReload && (
            <Alert
              severity="warning"
              title={t('admin.feature-toggles-page.reload-title', 'Reload may be required')}
              buttonContent={t('admin.feature-toggles-page.reload-button', 'Reload now')}
              onRemove={() => setHasPendingReload(false)}
              onClick={() => window.location.reload()}
            >
              <Trans i18nKey="admin.feature-toggles-page.reload-description">
                The in-memory flag value has been updated, but some Grafana code only reads feature flags during app
                startup.
              </Trans>
            </Alert>
          )}

          <div className={styles.toolbar}>
            <FilterInput
              value={query}
              onChange={setQuery}
              placeholder={t('admin.feature-toggles-page.search-placeholder', 'Search feature flags')}
            />
            <RadioButtonGroup
              value={filter}
              onChange={setFilter}
              options={[
                { label: t('admin.feature-toggles-page.filter-all', 'All'), value: 'all' },
                { label: t('admin.feature-toggles-page.filter-enabled', 'Enabled'), value: 'enabled' },
                { label: t('admin.feature-toggles-page.filter-disabled', 'Disabled'), value: 'disabled' },
                { label: t('admin.feature-toggles-page.filter-overridden', 'Overridden'), value: 'overridden' },
              ]}
            />
            <Button variant="secondary" disabled={Object.keys(overrides).length === 0} onClick={resetOverrides}>
              <Trans i18nKey="admin.feature-toggles-page.reset-all">Reset all overrides</Trans>
            </Button>
          </div>

          <Text color="secondary">
            {t('admin.feature-toggles-page.count', 'Showing {{visible}} of {{total}} feature flags', {
              visible: visibleRows.length,
              total: rows.length,
            })}
          </Text>

          {visibleRows.length === 0 && (
            <Alert severity="info" title={t('admin.feature-toggles-page.empty-title', 'No feature flags found')}>
              <Trans i18nKey="admin.feature-toggles-page.empty-description">
                Change your search or filter to show feature flags.
              </Trans>
            </Alert>
          )}

          <table className="filter-table form-inline">
            <thead>
              <tr>
                <th>
                  <Trans i18nKey="admin.feature-toggles-page.table-feature">Feature</Trans>
                </th>
                <th>
                  <Trans i18nKey="admin.feature-toggles-page.table-state">State</Trans>
                </th>
                <th>
                  <Trans i18nKey="admin.feature-toggles-page.table-override">Local override</Trans>
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.name}>
                  <td className={styles.nameCell}>
                    <code>{row.name}</code>
                  </td>
                  <td>
                    {row.enabled
                      ? t('admin.feature-toggles-page.enabled', 'Enabled')
                      : t('admin.feature-toggles-page.disabled', 'Disabled')}
                  </td>
                  <td>
                    <InlineSwitch
                      id={`feature-toggle-${row.name}`}
                      label={String(row.name)}
                      value={row.enabled}
                      onChange={(event) => updateOverride(row.name, event.currentTarget.checked)}
                    />
                  </td>
                  <td className={styles.actionsCell}>
                    {row.hasOverride && (
                      <Button fill="text" size="sm" onClick={() => removeOverride(row.name)}>
                        <Trans i18nKey="admin.feature-toggles-page.reset">Reset</Trans>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Stack>
      </Page.Contents>
    </Page>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    toolbar: css({
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(2),
      alignItems: 'center',
    }),
    nameCell: css({
      width: '45%',
    }),
    actionsCell: css({
      textAlign: 'right',
      width: theme.spacing(14),
    }),
  };
}
