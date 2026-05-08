import { useMemo } from 'react';
import { useAsync } from 'react-use';

import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Column, InteractiveTable, Spinner, Switch } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

const PAGE_SIZE = 50;

export interface ResolvedFeatureToggles {
  allowEditing: boolean;
  restartRequired: boolean;
  enabled: Record<string, boolean>;
  toggles: FeatureToggleStatus[];
}

export interface FeatureToggleStatus {
  name: string;
  description?: string;
  stage: string;
  enabled: boolean;
  writeable: boolean;
  warning?: string;
  requiresRestart?: boolean;
  frontend?: boolean;
  requiresDevMode?: boolean;
  expression?: string;
}

export default function FeatureFlagsPage() {
  const { loading, value, error } = useAsync(async () => {
    return await getBackendSrv().get<ResolvedFeatureToggles>('/api/admin/feature-toggles/resolved');
  }, []);

  const columns: Array<Column<FeatureToggleStatus>> = useMemo(
    () => [
      {
        id: 'name',
        header: t('labs.feature-flags.table.name', 'Name'),
        cell: ({ row }) => row.original.name,
      },
      {
        id: 'enabled',
        header: t('labs.feature-flags.table.enabled', 'Enabled'),
        disableGrow: true,
        cell: ({ row }) => (
          <Switch
            id={`labs-flag-${row.original.name}`}
            disabled
            value={row.original.enabled}
            label={t('labs.feature-flags.switch', 'Toggle {{name}}', { name: row.original.name })}
          />
        ),
      },
      {
        id: 'stage',
        header: t('labs.feature-flags.table.stage', 'Stage'),
        disableGrow: true,
        cell: ({ row }) => row.original.stage,
      },
      {
        id: 'requiresRestart',
        header: t('labs.feature-flags.table.requires-restart', 'Restart'),
        disableGrow: true,
        cell: ({ row }) =>
          row.original.requiresRestart
            ? t('labs.feature-flags.table.yes', 'Yes')
            : t('labs.feature-flags.table.no', 'No'),
      },
      {
        id: 'warning',
        header: t('labs.feature-flags.table.notes', 'Notes'),
        cell: ({ row }) => row.original.warning ?? '',
      },
      {
        id: 'description',
        header: t('labs.feature-flags.table.description', 'Description'),
        cell: ({ row }) => row.original.description ?? '',
      },
    ],
    []
  );

  return (
    <Page navId="labs/feature-flags">
      <Page.Contents>
        <Alert severity="info" title={t('labs.feature-flags.read-only.title', 'Read-only view')}>
          <Trans i18nKey="labs.feature-flags.read-only.body">
            Feature toggles are configured at startup (for example in grafana.ini). Editing from the UI is not
            available yet; switches reflect the current process state only.
          </Trans>
        </Alert>

        {loading && <Spinner />}
        {error && (
          <Alert severity="error" title={t('labs.feature-flags.load-error.title', 'Failed to load feature toggles')}>
            {String(error)}
          </Alert>
        )}

        {value && (
          <InteractiveTable
            columns={columns}
            data={value.toggles}
            pageSize={PAGE_SIZE}
            getRowId={(row) => row.name}
          />
        )}
      </Page.Contents>
    </Page>
  );
}
