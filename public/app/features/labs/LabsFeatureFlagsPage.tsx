import { useMemo, useState } from 'react';

import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import {
  Alert,
  Badge,
  type CellProps,
  type Column,
  InteractiveTable,
  Input,
  Stack,
  Text,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { useNavModel } from 'app/core/hooks/useNavModel';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

interface FeatureToggleRow {
  name: string;
  enabled: boolean;
}

type Cell<T extends keyof FeatureToggleRow = keyof FeatureToggleRow> = CellProps<FeatureToggleRow, FeatureToggleRow[T]>;

export default function LabsFeatureFlagsPage() {
  const navModel = useNavModel('labs-feature-flags');
  const [filter, setFilter] = useState('');

  const rows = useMemo<FeatureToggleRow[]>(() => {
    const toggles = config.featureToggles ?? {};
    return Object.keys(toggles)
      .map((name) => ({ name, enabled: Boolean(toggles[name as keyof typeof toggles]) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [filter, rows]);

  const enabledCount = useMemo(() => rows.filter((r) => r.enabled).length, [rows]);

  const columns: Array<Column<FeatureToggleRow>> = useMemo(
    () => [
      {
        id: 'name',
        header: t('labs.feature-flags.columns.name', 'Toggle'),
        cell: ({ cell: { value } }: Cell<'name'>) => <Text truncate>{value}</Text>,
        sortType: 'string',
      },
      {
        id: 'enabled',
        header: t('labs.feature-flags.columns.enabled', 'Enabled'),
        disableGrow: true,
        cell: ({ cell: { value } }: Cell<'enabled'>) =>
          value ? (
            <Badge text={t('labs.feature-flags.badge-yes', 'Yes')} color="green" />
          ) : (
            <Badge text={t('labs.feature-flags.badge-no', 'No')} color="blue" />
          ),
        sortType: 'basic',
      },
    ],
    []
  );

  if (!contextSrv.hasPermission(AccessControlAction.FeatureManagementRead)) {
    return (
      <Page navModel={navModel}>
        <Page.Contents>
          <Alert severity="warning" title={t('labs.feature-flags.no-access-title', 'Access denied')}>
            <Trans i18nKey="labs.feature-flags.no-access-body">
              You need permission to read feature toggles to view this page.
            </Trans>
          </Alert>
        </Page.Contents>
      </Page>
    );
  }

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Text color="secondary">
            {t('labs.feature-flags.summary', '{{enabled}} of {{total}} toggles are enabled for this browser session.', {
              enabled: enabledCount,
              total: rows.length,
            })}
          </Text>

          <Alert severity="info" title="">
            <Trans i18nKey="labs.feature-flags.config-info">
              Values come from the server configuration. Changing feature toggles requires updating Grafana config (for
              example grafana.ini) and usually restarting the instance.
            </Trans>
          </Alert>

          <Input
            width={50}
            placeholder={t('labs.feature-flags.filter-placeholder', 'Filter by name')}
            value={filter}
            onChange={(e) => setFilter(e.currentTarget.value)}
          />

          <InteractiveTable columns={columns} data={filteredRows} getRowId={(row) => row.name} pageSize={25} />
        </Stack>
      </Page.Contents>
    </Page>
  );
}
