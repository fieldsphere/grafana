import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Badge, FilterInput, Spinner, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

type FeatureToggleStatus = {
  name: string;
  description?: string;
  stage: string;
  enabled: boolean;
};

type FeatureTogglesResponse = {
  toggles: FeatureToggleStatus[];
};

export default function FeatureTogglesPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const { loading, error, value } = useAsync(
    () => getBackendSrv().get<FeatureTogglesResponse>('/api/admin/feature-toggles'),
    []
  );

  const toggles = useMemo(() => value?.toggles ?? [], [value]);
  const filteredToggles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return toggles;
    }

    return toggles.filter((toggle) =>
      [toggle.name, toggle.description ?? '', formatStage(toggle.stage)].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [query, toggles]);

  const enabledCount = toggles.filter((toggle) => toggle.enabled).length;

  return (
    <Page navId="server-settings">
      <Page.Contents className={styles.page}>
        <div>
          <h1>{t('admin.feature-toggles-page.title', 'Labs feature toggles')}</h1>
          <p className={styles.subtitle}>
            {t(
              'admin.feature-toggles-page.subtitle',
              'Inspect every registered feature flag and whether it is enabled for this Grafana instance.'
            )}
          </p>
        </div>

        <Alert severity="info" title="">
          {t(
            'admin.feature-toggles-page.info',
            'Enabled flags come from the current server configuration and runtime context. Missing flags are treated as disabled.'
          )}
        </Alert>

        <div className={styles.toolbar}>
          <FilterInput
            value={query}
            onChange={setQuery}
            escapeRegex={false}
            placeholder={t('admin.feature-toggles-page.search-placeholder', 'Filter by name, description, or stage')}
          />
          <div className={styles.summary}>
            {t('admin.feature-toggles-page.summary', '{{shown}} of {{total}} toggles shown - {{enabled}} enabled', {
              shown: filteredToggles.length,
              total: toggles.length,
              enabled: enabledCount,
            })}
          </div>
        </div>

        {loading && (
          <div className={styles.loadingState}>
            <Spinner />
          </div>
        )}

        {error && !loading && (
          <Alert
            severity="warning"
            title={t('admin.feature-toggles-page.error-title', 'Failed to load feature toggles')}
          >
            {formatError(error)}
          </Alert>
        )}

        {!loading && !error && filteredToggles.length === 0 && (
          <Alert severity="info" title={t('admin.feature-toggles-page.empty-title', 'No feature toggles match')}>
            {t('admin.feature-toggles-page.empty-description', 'Try a different search term.')}
          </Alert>
        )}

        {!loading && !error && filteredToggles.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('admin.feature-toggles-page.table.name', 'Name')}</th>
                  <th>{t('admin.feature-toggles-page.table.status', 'Status')}</th>
                  <th>{t('admin.feature-toggles-page.table.stage', 'Stage')}</th>
                  <th>{t('admin.feature-toggles-page.table.description', 'Description')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredToggles.map((toggle) => (
                  <tr key={toggle.name}>
                    <td className={styles.nameCell}>
                      <code>{toggle.name}</code>
                    </td>
                    <td>
                      <Badge
                        color={toggle.enabled ? 'green' : 'red'}
                        text={
                          toggle.enabled
                            ? t('admin.feature-toggles-page.badge.enabled', 'Enabled')
                            : t('admin.feature-toggles-page.badge.disabled', 'Disabled')
                        }
                      />
                    </td>
                    <td>
                      <Badge color={getStageColor(toggle.stage)} text={formatStage(toggle.stage)} />
                    </td>
                    <td>{toggle.description || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Page.Contents>
    </Page>
  );
}

function formatStage(stage: string) {
  switch (stage) {
    case 'GA':
      return 'GA';
    case 'privatePreview':
      return 'Private preview';
    case 'preview':
      return 'Preview';
    case 'deprecated':
      return 'Deprecated';
    case 'experimental':
      return 'Experimental';
    default:
      return 'Unknown';
  }
}

function getStageColor(stage: string): 'blue' | 'purple' | 'green' | 'orange' | 'red' {
  switch (stage) {
    case 'GA':
      return 'green';
    case 'privatePreview':
      return 'purple';
    case 'preview':
      return 'blue';
    case 'deprecated':
      return 'red';
    default:
      return 'orange';
  }
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return t('admin.feature-toggles-page.error-fallback', 'An unexpected error occurred while loading feature toggles.');
}

const getStyles = (theme: GrafanaTheme2) => ({
  page: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  subtitle: css({
    color: theme.colors.text.secondary,
    margin: `${theme.spacing(0.5)} 0 0`,
  }),
  toolbar: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    justifyContent: 'space-between',
  }),
  summary: css({
    color: theme.colors.text.secondary,
  }),
  loadingState: css({
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4, 0),
  }),
  tableWrapper: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    overflow: 'auto',
  }),
  table: css({
    borderCollapse: 'collapse',
    width: '100%',

    th: {
      background: theme.colors.background.secondary,
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeightMedium,
      padding: theme.spacing(1.5),
      position: 'sticky',
      textAlign: 'left',
      top: 0,
      whiteSpace: 'nowrap',
      zIndex: 1,
    },

    td: {
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      padding: theme.spacing(1.5),
      verticalAlign: 'top',
    },

    'tbody tr:last-child td': {
      borderBottom: 'none',
    },
  }),
  nameCell: css({
    whiteSpace: 'nowrap',
  }),
});
