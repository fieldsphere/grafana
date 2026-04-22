import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Alert, EmptyState, FilterInput, Stack, Spinner, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { FeatureToggleStatus, getFeatureToggles } from './state/apis';

function getStyles(theme: GrafanaTheme2) {
  return {
    actions: css({
      marginBottom: theme.spacing(2),
    }),
    tableContainer: css({
      overflowX: 'auto',
    }),
    table: css({
      width: '100%',
      borderCollapse: 'collapse',
      'th, td': {
        borderBottom: `1px solid ${theme.colors.border.weak}`,
        padding: theme.spacing(1),
        verticalAlign: 'top',
        textAlign: 'left',
      },
      th: {
        fontWeight: theme.typography.fontWeightBold,
      },
    }),
    enabled: css({
      color: theme.colors.success.text,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    disabled: css({
      color: theme.colors.warning.text,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    meta: css({
      color: theme.colors.text.secondary,
      marginTop: theme.spacing(0.5),
    }),
  };
}

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const [showEnabledOnly, setShowEnabledOnly] = useState(false);

  const { loading, error, value } = useAsync(async () => {
    return getFeatureToggles();
  }, []);

  const filteredToggles = useMemo(() => {
    const list = value ?? [];
    const normalizedQuery = query.trim().toLowerCase();

    return list.filter((toggle) => {
      if (showEnabledOnly && !toggle.enabled) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        toggle.name.toLowerCase().includes(normalizedQuery) ||
        toggle.description?.toLowerCase().includes(normalizedQuery) ||
        toggle.stage?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, showEnabledOnly, value]);

  return (
    <Page navId="labs">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Text variant="h3">
            {t('admin.labs.title', 'Labs feature toggles')}
          </Text>
          <Text color="secondary">
            {t(
              'admin.labs.description',
              'Inspect the current runtime state of feature toggles available in this Grafana instance.'
            )}
          </Text>
        </Stack>

        {error && (
          <Alert severity="error" title={t('admin.labs.error.title', 'Unable to load feature toggles')}>
            {t('admin.labs.error.description', 'Please try again or check server logs for more details.')}
          </Alert>
        )}

        <div className={styles.actions}>
          <Stack direction="row" alignItems="center" gap={2} wrap="wrap">
            <FilterInput
              value={query}
              onChange={setQuery}
              placeholder={t('admin.labs.search.placeholder', 'Filter feature toggles by name, description, or stage')}
            />
            <label>
              <input
                type="checkbox"
                checked={showEnabledOnly}
                onChange={(event) => setShowEnabledOnly(event.currentTarget.checked)}
              />{' '}
              {t('admin.labs.filters.enabled-only', 'Enabled only')}
            </label>
          </Stack>
        </div>

        {loading ? (
          <Spinner />
        ) : filteredToggles.length === 0 ? (
          <EmptyState message={t('admin.labs.empty', 'No feature toggles found')} variant="not-found" />
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('admin.labs.columns.toggle', 'Toggle')}</th>
                  <th>{t('admin.labs.columns.status', 'Enabled')}</th>
                  <th>{t('admin.labs.columns.stage', 'Stage')}</th>
                  <th>{t('admin.labs.columns.scope', 'Scope')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredToggles.map((toggle) => (
                  <tr key={toggle.name}>
                    <td>
                      <Text weight="medium">{toggle.name}</Text>
                      {toggle.description && <div className={styles.meta}>{toggle.description}</div>}
                    </td>
                    <td>
                      <span className={toggle.enabled ? styles.enabled : styles.disabled}>
                        {toggle.enabled
                          ? t('admin.labs.status.enabled', 'Enabled')
                          : t('admin.labs.status.disabled', 'Disabled')}
                      </span>
                    </td>
                    <td>{toggle.stage || t('admin.labs.stage.unknown', 'unknown')}</td>
                    <td>
                      {toggle.frontendOnly
                        ? t('admin.labs.scope.frontend', 'Frontend')
                        : t('admin.labs.scope.backend', 'Backend + Frontend')}
                      {toggle.requiresRestart && (
                        <div className={styles.meta}>{t('admin.labs.scope.restart', 'Requires restart')}</div>
                      )}
                    </td>
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
