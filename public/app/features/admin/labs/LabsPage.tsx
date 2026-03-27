import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Badge, Column, Input, InteractiveTable, Spinner, Stack } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

export interface FeatureToggleListItem {
  name: string;
  description?: string;
  stage: string;
  enabled: boolean;
  requiresDevMode?: boolean;
  requiresRestart?: boolean;
  frontend?: boolean;
  expression?: string;
}

interface FeatureToggleListResponse {
  flags: FeatureToggleListItem[];
}

export default function LabsPage() {
  const { loading, value, error } = useAsync(async () => {
    return await getBackendSrv().get<FeatureToggleListResponse>('/api/admin/feature-toggles');
  }, []);

  const [filter, setFilter] = useState('');

  const columns: Array<Column<FeatureToggleListItem>> = useMemo(
    () => [
      { id: 'name', header: t('admin.labs.column-name', 'Name'), sortType: 'alphanumeric' },
      {
        id: 'enabled',
        header: t('admin.labs.column-enabled', 'Enabled'),
        sortType: 'basic',
        cell: function EnabledCell({ row }) {
          return row.original.enabled ? (
            <Badge color="green" text={t('admin.labs.enabled-yes', 'Yes')} />
          ) : (
            <Badge color="red" text={t('admin.labs.enabled-no', 'No')} />
          );
        },
      },
      { id: 'stage', header: t('admin.labs.column-stage', 'Stage'), sortType: 'alphanumeric' },
      { id: 'description', header: t('admin.labs.column-description', 'Description'), sortType: 'alphanumeric' },
    ],
    []
  );

  const filteredFlags = useMemo(() => {
    const flags = value?.flags ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) {
      return flags;
    }
    return flags.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.description ?? '').toLowerCase().includes(q) ||
        f.stage.toLowerCase().includes(q)
    );
  }, [value, filter]);

  return (
    <Page navId="labs">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Alert severity="info" title="">
            <Trans i18nKey="admin.labs.info">
              Feature toggles are configured for this Grafana instance. Changes usually require a server restart or come
              from your hosting provider.
            </Trans>
          </Alert>
          {error != null && (
            <Alert severity="error" title={t('admin.labs.load-error-title', 'Failed to load feature toggles')}>
              {String(error)}
            </Alert>
          )}
          {loading && <Spinner />}
          {!loading && value != null && (
            <>
              <Input
                width={50}
                placeholder={t('admin.labs.filter-placeholder', 'Filter by name, stage, or description')}
                value={filter}
                onChange={(e) => setFilter(e.currentTarget.value)}
              />
              <InteractiveTable
                columns={columns}
                data={filteredFlags}
                getRowId={(row) => row.name}
                pageSize={0}
              />
            </>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}
