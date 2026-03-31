import { useCallback, useEffect, useMemo, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import {
  Alert,
  Badge,
  CellProps,
  Column,
  InteractiveTable,
  LoadingBar,
  Stack,
  Text,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

export interface FeatureFlagCatalogItem {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
  expression: string;
  requiresDevMode: boolean;
  frontend: boolean;
  requiresRestart: boolean;
}

interface CatalogResponse {
  featureFlags: FeatureFlagCatalogItem[];
}

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const [items, setItems] = useState<FeatureFlagCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canRead = contextSrv.hasPermission(AccessControlAction.FeatureManagementRead);

  const load = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getBackendSrv().get<CatalogResponse>('/api/featuremgmt/toggles');
      setItems(res.featureFlags ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [canRead]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo(
    (): Array<Column<FeatureFlagCatalogItem>> => [
      {
        id: 'name',
        header: t('labs.table.column-name', 'Name'),
        cell: ({ row: { original } }: CellProps<FeatureFlagCatalogItem, string>) => (
          <span className={styles.mono}>{original.name}</span>
        ),
      },
      {
        id: 'description',
        header: t('labs.table.column-description', 'Description'),
      },
      {
        id: 'stage',
        header: t('labs.table.column-stage', 'Stage'),
      },
      {
        id: 'enabled',
        header: t('labs.table.column-enabled', 'Enabled'),
        cell: ({ row: { original } }: CellProps<FeatureFlagCatalogItem, boolean>) =>
          original.enabled ? (
            <Badge text={t('labs.badge.enabled', 'On')} color="green" />
          ) : (
            <Badge text={t('labs.badge.disabled', 'Off')} color="blue" />
          ),
      },
    ],
    [styles.mono]
  );

  if (!canRead) {
    return (
      <Page navId="labs">
        <Page.Contents>
          <Alert title={t('labs.alert.no-permission.title', 'Permission required')} severity="warning">
            <Trans i18nKey="labs.alert.no-permission.body">
              You need the feature management read permission to view feature flags.
            </Trans>
          </Alert>
        </Page.Contents>
      </Page>
    );
  }

  return (
    <Page navId="labs">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Text element="p" color="secondary">
            <Trans i18nKey="labs.description">
              Feature flags available on this Grafana instance. Values reflect server configuration; many flags require
              a restart to change.
            </Trans>
          </Text>
          {error && (
            <Alert title={t('labs.alert.load-error.title', 'Could not load feature flags')} severity="error">
              {error}
            </Alert>
          )}
          {loading && <LoadingBar />}
          {!loading && !error && (
            <InteractiveTable columns={columns} data={items} getRowId={(row) => row.name} pageSize={50} />
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    mono: {
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.size.sm,
    },
  };
}
