import { useState } from 'react';

import { css } from '@emotion/css';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Badge, FilterInput, LoadingPlaceholder, ScrollContainer, Stack, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

type ToggleStatus = {
  name: string;
  description?: string;
  stage: string;
  enabled: boolean;
  writeable: boolean;
  warning?: string;
};

type LabsFeatureTogglesResponse = {
  allowEditing: boolean;
  restartRequired: boolean;
  enabled: Record<string, boolean>;
  toggles: ToggleStatus[];
};

function getStyles(theme: GrafanaTheme2) {
  return {
    controls: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      marginBottom: theme.spacing(2),
    }),
    filterInput: css({
      maxWidth: theme.spacing(40),
    }),
    table: css({
      width: '100%',
      minWidth: theme.spacing(110),
    }),
    headerCell: css({
      whiteSpace: 'nowrap',
    }),
    description: css({
      maxWidth: theme.spacing(80),
      whiteSpace: 'normal',
    }),
    warning: css({
      color: theme.colors.warning.text,
    }),
    muted: css({
      color: theme.colors.text.secondary,
    }),
    badgeCell: css({
      whiteSpace: 'nowrap',
    }),
  };
}

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const { value, loading, error } = useAsync(async () => {
    return getBackendSrv().get<LabsFeatureTogglesResponse>('/api/labs/feature-toggles');
  }, []);

  const [query, setQuery] = useState('');

  const toggles = (value?.toggles ?? []).filter((toggle) => {
    if (!query) {
      return true;
    }

    const search = query.toLowerCase();
    return (
      toggle.name.toLowerCase().includes(search) ||
      toggle.stage.toLowerCase().includes(search) ||
      toggle.description?.toLowerCase().includes(search)
    );
  });

  return (
    <Page navId="labs">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Text color="secondary">
            {t(
              'labs.page.subtitle',
              'View all feature flags in this Grafana instance and whether each one is currently enabled.'
            )}
          </Text>

          {loading && <LoadingPlaceholder text={t('common.loading', 'Loading...')} />}

          {error && (
            <Alert severity="error" title={t('labs.page.error-title', 'Failed to load feature flags')}>
              {t('labs.page.error-body', 'Try refreshing the page or check the server logs for more details.')}
            </Alert>
          )}

          {!loading && !error && (
            <>
              <div className={styles.controls}>
                <FilterInput
                  className={styles.filterInput}
                  value={query}
                  onChange={setQuery}
                  placeholder={t('labs.page.search-placeholder', 'Search feature flags')}
                  aria-label={t('labs.page.search-aria-label', 'Search feature flags')}
                />
                <Text color="secondary">
                  {t('labs.page.results-count', '{{count}} flags', { count: toggles.length })}
                </Text>
                {value?.restartRequired && (
                  <Alert severity="warning" title={t('labs.page.restart-required', 'A restart is required')}>
                    {t(
                      'labs.page.restart-required-description',
                      'Some feature toggle changes will not take effect until Grafana is restarted.'
                    )}
                  </Alert>
                )}
              </div>

              <ScrollContainer overflowY="visible" overflowX="auto" width="100%">
                <table className={`filter-table filter-table--hover ${styles.table}`}>
                  <thead>
                    <tr>
                      <th className={styles.headerCell}>{t('labs.page.columns.name', 'Name')}</th>
                      <th className={styles.headerCell}>{t('labs.page.columns.status', 'Status')}</th>
                      <th className={styles.headerCell}>{t('labs.page.columns.stage', 'Stage')}</th>
                      <th className={styles.headerCell}>{t('labs.page.columns.description', 'Description')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toggles.map((toggle) => (
                      <tr key={toggle.name}>
                        <td>
                          <Text element="span" weight="medium">
                            {toggle.name}
                          </Text>
                        </td>
                        <td className={styles.badgeCell}>
                          <Badge
                            color={toggle.enabled ? 'green' : 'darkgrey'}
                            text={toggle.enabled ? t('labs.page.enabled', 'Enabled') : t('labs.page.disabled', 'Disabled')}
                            icon={toggle.enabled ? 'check-circle' : 'times-circle'}
                          />
                        </td>
                        <td>
                          <Text element="span" className={styles.muted}>
                            {toggle.stage || t('labs.page.unknown-stage', 'unknown')}
                          </Text>
                        </td>
                        <td className={styles.description}>
                          <Stack direction="column" gap={0}>
                            <Text element="span">{toggle.description || t('labs.page.no-description', 'No description')}</Text>
                            {toggle.warning && <Text element="span" className={styles.warning}>{toggle.warning}</Text>}
                          </Stack>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollContainer>
            </>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}
