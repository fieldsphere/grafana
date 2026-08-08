import { useMemo } from 'react';

import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Badge, InteractiveTable, type CellProps, type Column } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

type FeatureToggleRow = {
  name: string;
  enabled: boolean;
};

export default function LabsPage() {
  const data = useMemo(
    () =>
      Object.entries(config.featureToggles)
        .map(([name, enabled]) => ({ name, enabled: Boolean(enabled) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const columns = useMemo(
    (): Array<Column<FeatureToggleRow>> => [
      {
        id: 'name',
        header: t('labs-page.column-flag', 'Feature flag'),
        cell: ({ row: { original } }: CellProps<FeatureToggleRow>) => original.name,
      },
      {
        id: 'enabled',
        header: t('labs-page.column-enabled', 'Enabled'),
        cell: ({ row: { original } }: CellProps<FeatureToggleRow>) => (
          <Badge
            text={original.enabled ? t('labs-page.enabled-yes', 'Yes') : t('labs-page.enabled-no', 'No')}
            color={original.enabled ? 'green' : 'red'}
          />
        ),
      },
    ],
    []
  );

  return (
    <Page navId="labs">
      <Page.Contents>
        <p>
          <Trans i18nKey="labs-page.description">
            Feature flags for this Grafana instance (from frontend boot data). Some flags are controlled by server
            configuration or your organization; not all flags can be changed from the UI.
          </Trans>
        </p>
        <InteractiveTable data={data} columns={columns} getRowId={(row) => row.name} />
      </Page.Contents>
    </Page>
  );
}
