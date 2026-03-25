import { useMemo } from 'react';
import { useAsync } from 'react-use';

import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import {
  Alert,
  Badge,
  InteractiveTable,
  LoadingPlaceholder,
  type CellProps,
  type Column,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

export interface FeatureFlagRow {
  name: string;
  description: string;
  stage?: string;
  expression: string;
  requiresDevMode?: boolean;
  frontend?: boolean;
  hideFromDocs?: boolean;
  requiresRestart?: boolean;
  enabled: boolean;
  warning?: string;
}

export default function LabsPage() {
  const { loading, value: flags, error } = useAsync(async () => {
    return getBackendSrv().get<FeatureFlagRow[]>('/api/featuremgmt/flags');
  }, []);

  const columns: Array<Column<FeatureFlagRow>> = useMemo(
    () => [
      {
        id: 'name',
        header: t('labs.table.name', 'Name'),
        sortType: 'string',
      },
      {
        id: 'description',
        header: t('labs.table.description', 'Description'),
        cell: ({ row }: CellProps<FeatureFlagRow>) => row.original.description,
      },
      {
        id: 'stage',
        header: t('labs.table.stage', 'Stage'),
        cell: ({ row }: CellProps<FeatureFlagRow>) => row.original.stage ?? '—',
      },
      {
        id: 'enabled',
        header: t('labs.table.enabled', 'Enabled'),
        cell: ({ row }: CellProps<FeatureFlagRow>) =>
          row.original.enabled ? (
            <Badge color="green" text={t('labs.table.enabled-on', 'On')} />
          ) : (
            <Badge color="red" text={t('labs.table.enabled-off', 'Off')} />
          ),
      },
      {
        id: 'warning',
        header: t('labs.table.note', 'Note'),
        cell: ({ row }: CellProps<FeatureFlagRow>) => row.original.warning ?? '',
      },
    ],
    []
  );

  return (
    <Page navId="labs">
      <Page.Contents>
        <Alert severity="info" title="">
          <Trans i18nKey="labs.description">
            All feature flags registered in this Grafana build and their current enabled state for this instance.
          </Trans>
        </Alert>

        {loading && <LoadingPlaceholder text={t('labs.loading', 'Loading feature flags')} />}
        {error && (
          <Alert severity="error" title={t('labs.error-title', 'Failed to load feature flags')}>
            {String(error)}
          </Alert>
        )}
        {flags && !loading && !error && (
          <InteractiveTable columns={columns} data={flags} getRowId={(row) => row.name} />
        )}
      </Page.Contents>
    </Page>
  );
}
