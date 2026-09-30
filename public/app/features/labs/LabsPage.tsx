import { useEffect, useMemo, useState } from 'react';

import { t, Trans } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Badge, type CellProps, type Column, InteractiveTable, Spinner, Stack, Text } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

export interface RegisteredFeatureFlagDTO {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
  expression?: string;
  requiresDevMode?: boolean;
  frontendOnly?: boolean;
}

export default function LabsPage() {
  const [flags, setFlags] = useState<RegisteredFeatureFlagDTO[] | undefined>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    getBackendSrv()
      .get<RegisteredFeatureFlagDTO[]>('/api/featuremgmt/registered-flags')
      .then((data) => setFlags(data))
      .catch(() => setError(t('labs-page.load-error', 'Could not load feature flags')));
  }, []);

  const columns = useMemo<Array<Column<RegisteredFeatureFlagDTO>>>(
    () => [
      {
        id: 'name',
        header: t('labs-page.column-name', 'Flag'),
      },
      {
        id: 'enabled',
        header: t('labs-page.column-enabled', 'Enabled'),
        cell: ({ row }: CellProps<RegisteredFeatureFlagDTO>) => (
          <Badge
            color={row.original.enabled ? 'green' : 'red'}
            text={row.original.enabled ? t('labs-page.enabled-yes', 'On') : t('labs-page.enabled-no', 'Off')}
          />
        ),
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
        <Stack direction="column" gap={2}>
          <Text element="p">
            <Trans i18nKey="labs-page.intro">
              All feature toggles registered in this Grafana build and whether they are enabled for your session.
            </Trans>
          </Text>
          {error && <Alert title={error} severity="error" />}
          {flags === undefined ? (
            <Spinner />
          ) : (
            <InteractiveTable columns={columns} data={flags} getRowId={(row) => row.name} />
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}
