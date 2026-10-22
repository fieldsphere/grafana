import { useEffect, useMemo, useState } from 'react';

import { t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { type CellProps, type Column, Badge, InteractiveTable, Spinner } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

interface LabsFeatureFlag {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
  frontendOnly: boolean;
}

export default function LabsPage() {
  const [flags, setFlags] = useState<LabsFeatureFlag[] | undefined>();
  const [loadError, setLoadError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    getBackendSrv()
      .get<LabsFeatureFlag[]>('/api/labs/feature-toggles')
      .then((rows) => {
        if (!cancelled) {
          setFlags(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(t('labs-page.error.load', 'Could not load feature flags'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const columns = useMemo(
    (): Array<Column<LabsFeatureFlag>> => [
      {
        id: 'name',
        header: t('labs-page.column.name', 'Flag'),
        cell: ({ row }: CellProps<LabsFeatureFlag, void>) => row.original.name,
      },
      {
        id: 'stage',
        header: t('labs-page.column.stage', 'Stage'),
        cell: ({ row }: CellProps<LabsFeatureFlag, void>) => row.original.stage,
      },
      {
        id: 'enabled',
        header: t('labs-page.column.enabled', 'Enabled'),
        cell: ({ row }: CellProps<LabsFeatureFlag, void>) => (
          <Badge
            text={
              row.original.enabled
                ? t('labs-page.enabled.yes', 'On')
                : t('labs-page.enabled.no', 'Off')
            }
            color={row.original.enabled ? 'green' : 'red'}
          />
        ),
      },
      {
        id: 'frontendOnly',
        header: t('labs-page.column.scope', 'Scope'),
        cell: ({ row }: CellProps<LabsFeatureFlag, void>) =>
          row.original.frontendOnly
            ? t('labs-page.scope.frontend', 'Frontend')
            : t('labs-page.scope.full-stack', 'Full stack'),
      },
      {
        id: 'description',
        header: t('labs-page.column.description', 'Description'),
        cell: ({ row }: CellProps<LabsFeatureFlag, void>) => row.original.description,
      },
    ],
    []
  );

  return (
    <Page navId="labs">
      <Page.Contents>
        {loadError && <p>{loadError}</p>}
        {flags === undefined && !loadError && <Spinner />}
        {flags && (
          <InteractiveTable columns={columns} data={flags} getRowId={(row) => row.name} />
        )}
      </Page.Contents>
    </Page>
  );
}
