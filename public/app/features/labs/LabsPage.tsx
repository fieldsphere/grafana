import { useCallback, useEffect, useMemo, useState } from 'react';

import { type CellProps } from '@tanstack/react-table';
import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Badge, InteractiveTable, LoadingPlaceholder, type Column, Alert } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

export interface FeatureFlagRegistryRow {
  name: string;
  description: string;
  stage: string;
  expression: string;
  requiresDevMode: boolean;
  frontendOnly: boolean;
  hideFromDocs: boolean;
  requiresRestart: boolean;
  enabled: boolean;
}

function EnabledCell({ cell: { value: enabled } }: CellProps<FeatureFlagRegistryRow, boolean>) {
  return enabled ? (
    <Badge text={t('labs-page.badge-on', 'On')} color="green" />
  ) : (
    <Badge text={t('labs-page.badge-off', 'Off')} color="blue" />
  );
}

export default function LabsPage() {
  const [rows, setRows] = useState<FeatureFlagRegistryRow[] | undefined>();
  const [error, setError] = useState<Error | undefined>();

  const load = useCallback(async () => {
    setError(undefined);
    try {
      const data = await getBackendSrv().get<FeatureFlagRegistryRow[]>('/api/user/feature-flags/registry');
      setRows(data);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(
    (): Array<Column<FeatureFlagRegistryRow>> => [
      {
        id: 'name',
        header: t('labs-page.column-name', 'Name'),
      },
      {
        id: 'enabled',
        header: t('labs-page.column-enabled', 'Enabled'),
        cell: EnabledCell,
      },
      {
        id: 'stage',
        header: t('labs-page.column-stage', 'Stage'),
      },
      {
        id: 'description',
        header: t('labs-page.column-description', 'Description'),
      },
      {
        id: 'expression',
        header: t('labs-page.column-expression', 'Default expression'),
      },
    ],
    []
  );

  return (
    <Page navId="labs">
      <Page.Contents>
        <p>
          <Trans i18nKey="labs-page.intro">
            All feature flags registered in this Grafana build. Values reflect the running server (restart may be
            required for some flags).
          </Trans>
        </p>
        {error && (
          <Alert title={t('labs-page.error-title', 'Failed to load feature flags')} severity="error">
            {error.message}
          </Alert>
        )}
        {rows === undefined ? (
          <LoadingPlaceholder text={t('labs-page.loading', 'Loading feature flags…')} />
        ) : (
          <InteractiveTable columns={columns} data={rows} getRowId={(row) => row.name} pageSize={50} />
        )}
      </Page.Contents>
    </Page>
  );
}
