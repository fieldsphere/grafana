import { css } from '@emotion/css';
import { useMemo, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Alert, Button, Field, Input, Pagination, ScrollContainer, Switch, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { useNavModel } from 'app/core/hooks/useNavModel';
import { contextSrv } from 'app/core/services/context_srv';

const LOCAL_STORAGE_KEY = 'grafana.featureToggles';
const PAGE_SIZE = 20;

type ToggleRecord = {
  name: string;
  enabled: boolean;
};

function getStyles(theme: GrafanaTheme2) {
  return {
    controls: css({
      display: 'flex',
      gap: theme.spacing(2),
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: theme.spacing(2),
      flexWrap: 'wrap',
    }),
    searchField: css({
      minWidth: '280px',
      width: '100%',
      maxWidth: '420px',
    }),
    section: css({
      marginBottom: theme.spacing(2),
    }),
    table: css({
      width: '100%',
      borderCollapse: 'collapse',
      tableLayout: 'fixed',
      '& th, & td': {
        borderBottom: `1px solid ${theme.colors.border.weak}`,
        padding: theme.spacing(1.25, 1),
        textAlign: 'left',
        verticalAlign: 'middle',
      },
    }),
    nameCell: css({
      fontFamily: theme.typography.fontFamilyMonospace,
      wordBreak: 'break-word',
    }),
    footer: css({
      marginTop: theme.spacing(2),
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing(2),
      flexWrap: 'wrap',
    }),
    helperText: css({
      color: theme.colors.text.secondary,
      margin: 0,
    }),
    empty: css({
      color: theme.colors.text.secondary,
      margin: theme.spacing(2, 0),
    }),
  };
}

function parseLocalStorageOverrides(): Map<string, boolean> {
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  const parsed = new Map<string, boolean>();

  if (!raw) {
    return parsed;
  }

  for (const feature of raw.split(',')) {
    if (!feature) {
      continue;
    }

    const [name, value] = feature.split('=');
    if (!name) {
      continue;
    }
    parsed.set(name, value === '1' || value === 'true');
  }

  return parsed;
}

function serializeLocalStorageOverrides(overrides: Map<string, boolean>) {
  const encoded = Array.from(overrides.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, enabled]) => `${name}=${enabled}`)
    .join(',');

  if (encoded) {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, encoded);
  } else {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

function getCombinedToggles(): ToggleRecord[] {
  const runtimeToggles = config.featureToggles as Record<string, boolean | undefined>;
  const overrideToggles = parseLocalStorageOverrides();
  const names = new Set([...Object.keys(runtimeToggles), ...overrideToggles.keys()]);

  return Array.from(names)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      enabled: overrideToggles.has(name) ? overrideToggles.get(name)! : Boolean(runtimeToggles[name]),
    }));
}

export default function FeatureFlagDashboard() {
  const styles = useStyles2(getStyles);
  const navModel = useNavModel('feature-flag-dashboard');
  const [toggles, setToggles] = useState<ToggleRecord[]>(() => getCombinedToggles());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const canWrite = contextSrv.hasPermission('featuremgmt.write');

  const filteredToggles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return toggles;
    }
    return toggles.filter((toggle) => toggle.name.toLowerCase().includes(term));
  }, [search, toggles]);

  const numberOfPages = Math.max(1, Math.ceil(filteredToggles.length / PAGE_SIZE));
  const boundedPage = Math.min(page, numberOfPages);
  const startIndex = (boundedPage - 1) * PAGE_SIZE;
  const pageRows = filteredToggles.slice(startIndex, startIndex + PAGE_SIZE);

  const onToggle = (name: string, enabled: boolean) => {
    const nextToggles = toggles.map((toggle) => (toggle.name === name ? { ...toggle, enabled } : toggle));
    setToggles(nextToggles);

    const overrides = parseLocalStorageOverrides();
    overrides.set(name, enabled);
    serializeLocalStorageOverrides(overrides);
  };

  const clearOverrides = () => {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    setToggles(getCombinedToggles());
  };

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <Alert title={t('admin.feature-flag-dashboard.title', 'Feature flagging dashboard')} severity="info">
          <Trans i18nKey="admin.feature-flag-dashboard.description">
            Review enabled feature flags and control them for this browser session by writing local overrides.
          </Trans>
        </Alert>

        {!canWrite && (
          <Alert title={t('admin.feature-flag-dashboard.readonly-title', 'Read-only access')} severity="warning">
            <Trans i18nKey="admin.feature-flag-dashboard.readonly-description">
              You can view feature flags, but you need settings write access to change values.
            </Trans>
          </Alert>
        )}

        <section className={styles.section}>
          <div className={styles.controls}>
            <Field
              label={t('admin.feature-flag-dashboard.search-label', 'Search feature flags')}
              className={styles.searchField}
              noMargin
            >
              <Input
                value={search}
                data-testid="feature-flag-dashboard-search"
                onChange={(event) => {
                  setSearch(event.currentTarget.value);
                  setPage(1);
                }}
                placeholder={t('admin.feature-flag-dashboard.search-placeholder', 'Filter by feature name')}
              />
            </Field>
            <Button
              variant="secondary"
              icon="sync"
              onClick={clearOverrides}
              disabled={!canWrite}
              data-testid="feature-flag-dashboard-reset"
            >
              <Trans i18nKey="admin.feature-flag-dashboard.reset-button">Reset local overrides</Trans>
            </Button>
          </div>

          {filteredToggles.length === 0 ? (
            <p className={styles.empty}>
              <Trans i18nKey="admin.feature-flag-dashboard.empty-state">No feature flags match your search.</Trans>
            </p>
          ) : (
            <ScrollContainer overflowY="visible" overflowX="auto" width="100%">
              <table className={styles.table} data-testid="feature-flag-dashboard-table">
                <thead>
                  <tr>
                    <th>
                      <Trans i18nKey="admin.feature-flag-dashboard.table.name">Feature</Trans>
                    </th>
                    <th>
                      <Trans i18nKey="admin.feature-flag-dashboard.table.enabled">Enabled</Trans>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((toggle) => (
                    <tr key={toggle.name}>
                      <td className={styles.nameCell}>{toggle.name}</td>
                      <td>
                        <Switch
                          aria-label={toggle.name}
                          value={toggle.enabled}
                          onChange={(event) => onToggle(toggle.name, event.currentTarget.checked)}
                          disabled={!canWrite}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollContainer>
          )}

          <div className={styles.footer}>
            <p className={styles.helperText}>
              <Trans
                i18nKey="admin.feature-flag-dashboard.count"
                values={{ shown: pageRows.length, total: filteredToggles.length }}
              >
                Showing {{ shown: pageRows.length }} of {{ total: filteredToggles.length }} feature flags.
              </Trans>
            </p>
            <Pagination currentPage={boundedPage} numberOfPages={numberOfPages} onNavigate={setPage} />
          </div>
        </section>
      </Page.Contents>
    </Page>
  );
}
