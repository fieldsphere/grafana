import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Alert, Badge, FilterInput, InteractiveTable, Stack, Text, type Column, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { getLabsFeatureToggles, type LabsFeatureToggle } from './api';

const LabsPage = () => {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const { value: toggles = [], loading, error } = useAsync(async () => (await getLabsFeatureToggles()).toggles, []);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredToggles = useMemo(() => {
    if (!normalizedQuery) {
      return toggles;
    }

    return toggles.filter((toggle) => {
      return (
        toggle.name.toLowerCase().includes(normalizedQuery) ||
        toggle.description.toLowerCase().includes(normalizedQuery) ||
        toggle.stage.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, toggles]);

  const enabledCount = filteredToggles.filter((toggle) => toggle.enabled).length;
  const disabledCount = filteredToggles.length - enabledCount;

  const columns = useMemo<Array<Column<LabsFeatureToggle>>>(
    () => [
      {
        id: 'name',
        header: t('labs.feature-toggles.columns.name', 'Feature flag'),
        accessorFn: (toggle) => toggle.name,
        cell: ({ row }) => <Text weight="medium">{row.original.name}</Text>,
        sortType: 'string',
      },
      {
        id: 'status',
        header: t('labs.feature-toggles.columns.status', 'Status'),
        accessorFn: (toggle) => (toggle.enabled ? 1 : 0),
        cell: ({ row }) => (
          <Badge
            text={
              row.original.enabled
                ? t('labs.feature-toggles.enabled', 'Enabled')
                : t('labs.feature-toggles.disabled', 'Disabled')
            }
            color={row.original.enabled ? 'green' : 'red'}
          />
        ),
        sortType: 'number',
      },
      {
        id: 'stage',
        header: t('labs.feature-toggles.columns.stage', 'Stage'),
        accessorFn: (toggle) => toggle.stage,
        sortType: 'string',
      },
      {
        id: 'description',
        header: t('labs.feature-toggles.columns.description', 'Description'),
        accessorFn: (toggle) => toggle.description,
        cell: ({ row }) => (
          <Text color="secondary">
            {row.original.description || t('labs.feature-toggles.no-description', 'No description')}
          </Text>
        ),
      },
    ],
    []
  );

  return (
    <Page>
      <Page.Contents isLoading={loading}>
        <Stack direction="column" gap={2}>
          <div>
            <Text element="h1" variant="h3">
              {t('labs.feature-toggles.title', 'Labs')}
            </Text>
            <Text color="secondary">
              {t(
                'labs.feature-toggles.subtitle',
                'Inspect Grafana feature flags and whether each flag is currently enabled.'
              )}
            </Text>
          </div>

          <div className={styles.toolbar}>
            <FilterInput
              className={styles.filter}
              placeholder={t('labs.feature-toggles.search-placeholder', 'Search feature flags')}
              value={query}
              escapeRegex={false}
              onChange={setQuery}
            />
            <Stack gap={1}>
              <Badge
                text={t('labs.feature-toggles.total-count', '{{count}} total', { count: filteredToggles.length })}
                color="blue"
              />
              <Badge
                text={t('labs.feature-toggles.enabled-count', '{{count}} enabled', { count: enabledCount })}
                color="green"
              />
              <Badge
                text={t('labs.feature-toggles.disabled-count', '{{count}} disabled', { count: disabledCount })}
                color="red"
              />
            </Stack>
          </div>

          {error ? (
            <Alert title={t('labs.feature-toggles.load-error-title', 'Could not load feature flags')} severity="error">
              {t(
                'labs.feature-toggles.load-error-body',
                'The Labs page could not fetch the feature flag registry. Try refreshing the page.'
              )}
            </Alert>
          ) : (
            <InteractiveTable
              columns={columns}
              data={filteredToggles}
              getRowId={(toggle) => toggle.name}
              className={styles.table}
            />
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  toolbar: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
  filter: css({
    minWidth: 320,
    flex: '1 1 320px',
  }),
  table: css({
    width: '100%',
  }),
});

export default LabsPage;
