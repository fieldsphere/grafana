import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Alert, Badge, FilterInput, InteractiveTable, type Column, Stack, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { getAdminFeatureToggles, type AdminFeatureToggle } from './state/apis';

export function LabsPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const { loading, value, error } = useAsync(() => getAdminFeatureToggles(), []);

  const data = useMemo(() => {
    const toggles = value ?? [];
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return toggles;
    }

    return toggles.filter((toggle) =>
      [toggle.name, toggle.description, toggle.stage, toggle.expression]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(normalized))
    );
  }, [query, value]);

  const columns = useMemo<Array<Column<AdminFeatureToggle>>>(
    () => [
      {
        id: 'name',
        header: t('admin.labs-page.columns.flag', 'Flag'),
        accessorKey: 'name',
        cell: ({ row }) => <code>{row.original.name}</code>,
      },
      {
        id: 'status',
        header: t('admin.labs-page.columns.status', 'Status'),
        cell: ({ row }) => (
          <Badge
            text={row.original.enabled ? t('admin.labs-page.enabled', 'Enabled') : t('admin.labs-page.disabled', 'Disabled')}
            color={row.original.enabled ? 'green' : 'red'}
          />
        ),
      },
      {
        id: 'stage',
        header: t('admin.labs-page.columns.stage', 'Stage'),
        accessorKey: 'stage',
        cell: ({ row }) => row.original.stage || t('admin.labs-page.unknown', 'unknown'),
      },
      {
        id: 'description',
        header: t('admin.labs-page.columns.description', 'Description'),
        accessorKey: 'description',
        cell: ({ row }) => <span className={styles.description}>{row.original.description || '-'}</span>,
      },
      {
        id: 'attributes',
        header: t('admin.labs-page.columns.attributes', 'Attributes'),
        cell: ({ row }) => <FeatureAttributes toggle={row.original} />,
      },
    ],
    [styles.description]
  );

  return (
    <Page navId="labs">
      <Page.Contents isLoading={loading}>
        <Stack direction="column" gap={2}>
          <Alert severity="info" title={t('admin.labs-page.alert.title', 'Labs feature flags')}>
            {t(
              'admin.labs-page.alert.body',
              'This page lists all registered feature flags and their current effective state in this Grafana instance.'
            )}
          </Alert>

          <div className={styles.toolbar}>
            <FilterInput
              placeholder={t('admin.labs-page.search.placeholder', 'Search feature flags')}
              aria-label={t('admin.labs-page.search.aria-label', 'Search feature flags')}
              value={query}
              onChange={setQuery}
              escapeRegex={false}
            />
            <div className={styles.summary}>
              {t(
                'admin.labs-page.summary',
                '{{shown}} of {{total}} flags',
                { shown: data.length, total: value?.length ?? 0 }
              )}
            </div>
          </div>

          {error && (
            <Alert severity="error" title={t('admin.labs-page.error.title', 'Unable to load feature flags')}>
              {t(
                'admin.labs-page.error.body',
                'Grafana could not fetch the feature-flag registry for this page.'
              )}
            </Alert>
          )}

          {!error && <InteractiveTable columns={columns} data={data} getRowId={(row) => row.name} pageSize={25} />}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

export default LabsPage;

function FeatureAttributes({ toggle }: { toggle: AdminFeatureToggle }) {
  const attrs = [
    toggle.frontendOnly && t('admin.labs-page.attributes.frontend', 'Frontend only'),
    toggle.requiresDevMode && t('admin.labs-page.attributes.dev-mode', 'Requires dev mode'),
    toggle.requiresRestart && t('admin.labs-page.attributes.restart', 'Requires restart'),
    toggle.expression && `${t('admin.labs-page.attributes.default', 'Default')}: ${toggle.expression}`,
  ].filter(Boolean);

  if (attrs.length === 0) {
    return <span>-</span>;
  }

  return (
    <Stack wrap="wrap" gap={1}>
      {attrs.map((attr) => (
        <Badge key={attr} text={attr} color="blue" />
      ))}
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  toolbar: css({
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    alignItems: 'center',
    flexWrap: 'wrap',
  }),
  summary: css({
    color: theme.colors.text.secondary,
  }),
  description: css({
    color: theme.colors.text.secondary,
  }),
});
