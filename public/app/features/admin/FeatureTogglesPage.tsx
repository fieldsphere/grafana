import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Alert, FilterInput, Spinner, Stack, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { FeatureTogglesTable } from './FeatureTogglesTable';
import { FeatureFlag, getFeatureFlags } from './state/apis';

export default function FeatureTogglesPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const { loading, value } = useAsync(() => getFeatureFlags(), []);

  const filteredToggles = useMemo(() => {
    const items = value ?? [];
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        item.stage.toLowerCase().includes(normalizedQuery) ||
        (item.enabled ? 'enabled' : 'disabled').includes(normalizedQuery)
      );
    });
  }, [query, value]);

  return (
    <Page navId="feature-toggles">
      <Page.Contents isLoading={loading}>
        <Stack direction="column" gap={3}>
          <Stack direction="column" gap={1}>
            <Text element="h1" variant="h3">
              {t('admin.feature-toggles-page.title', 'Feature toggles')}
            </Text>
            <Text color="secondary">
              {t(
                'admin.feature-toggles-page.description',
                'Inspect every registered feature flag and whether it is currently enabled in this Grafana instance.'
              )}
            </Text>
          </Stack>

          <Alert severity="info" title="">
            {t(
              'admin.feature-toggles-page.alert',
              'Flags that require a restart or dev mode show that metadata so you can tell why a toggle may not be active.'
            )}
          </Alert>

          <div className={styles.filterRow}>
            <FilterInput
              placeholder={t(
                'admin.feature-toggles-page.filter-placeholder',
                'Search by flag name, stage, description, or status'
              )}
              value={query}
              onChange={setQuery}
            />
            <Text color="secondary">
              {t('admin.feature-toggles-page.results-count', '{{count}} flags', { count: filteredToggles.length })}
            </Text>
          </div>

          {loading && (
            <div className={styles.loadingRow}>
              <Spinner />
            </div>
          )}

          {!loading && value && value.length > 0 && <FeatureTogglesTable featureToggles={filteredToggles} />}

          {!loading && value && value.length === 0 && (
            <Text color="secondary">
              {t('admin.feature-toggles-page.empty', 'No feature toggles are registered in this build.')}
            </Text>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  filterRow: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
  }),
  loadingRow: css({
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4, 0),
  }),
});
