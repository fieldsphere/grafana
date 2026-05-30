import { useMemo } from 'react';
import { useAsync } from 'react-use';

import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Badge, InteractiveTable, LoadingPlaceholder, type Column } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

interface CatalogEntry {
  name: string;
  description?: string;
  stage?: string;
  enabled: boolean;
}

interface CatalogResponse {
  flags: CatalogEntry[];
}

export default function LabsPage() {
  const { loading, error, value } = useAsync(
    () => getBackendSrv().get<CatalogResponse>('/api/feature-toggles/catalog'),
    []
  );

  const columns = useMemo(
    (): Array<Column<CatalogEntry>> => [
      {
        id: 'name',
        header: t('labs.table.column-flag', 'Flag'),
        cell: ({ row: { original } }) => original.name,
      },
      {
        id: 'enabled',
        header: t('labs.table.column-enabled', 'Enabled'),
        cell: ({ row: { original } }) =>
          original.enabled ? (
            <Badge color="green" text={t('labs.badge-enabled', 'Enabled')} />
          ) : (
            <Badge color="orange" text={t('labs.badge-disabled', 'Disabled')} />
          ),
      },
      {
        id: 'stage',
        header: t('labs.table.column-stage', 'Stage'),
        cell: ({ row: { original } }) => original.stage ?? '—',
      },
      {
        id: 'description',
        header: t('labs.table.column-description', 'Description'),
        cell: ({ row: { original } }) => original.description ?? '',
      },
    ],
    []
  );

  const data = value?.flags ?? [];

  return (
    <Page navId="labs">
      <Page.Contents>
        <Alert severity="info" title="">
          <Trans i18nKey="labs.page-description">
            All feature flags registered in this Grafana build and whether each is enabled for your organization.
          </Trans>
        </Alert>

        {error && (
          <Alert severity="error" title={t('labs.load-error-title', 'Could not load feature flags')}>
            {(error as Error).message}
          </Alert>
        )}

        {loading && <LoadingPlaceholder text={t('labs.loading', 'Loading feature flags')} />}

        {!loading && !error && <InteractiveTable columns={columns} data={data} getRowId={(row) => row.name} />}
      </Page.Contents>
    </Page>
  );
}
