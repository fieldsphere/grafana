import { useCallback, useEffect, useMemo, useState } from 'react';

import { type Column } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import {
  Alert,
  Button,
  Field,
  Input,
  InteractiveTable,
  Stack,
  Switch,
  Text,
  TextLink,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

export interface LabsFlagRow {
  name: string;
  description: string;
  stage: string;
  frontendOnly: boolean;
  requiresRestart: boolean;
  requiresDevMode: boolean;
  enabled: boolean;
  source: string;
  writable: boolean;
  meetsRuntime: boolean;
  blockedReason?: string;
}

export function LabsFeatureTogglesPage() {
  const [rows, setRows] = useState<LabsFlagRow[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canRead = contextSrv.hasPermission(AccessControlAction.FeatureManagementRead);
  const canWrite = contextSrv.hasPermission(AccessControlAction.FeatureManagementWrite);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBackendSrv().get<LabsFlagRow[]>('/api/admin/labs/feature-toggles');
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canRead) {
      load();
    } else {
      setLoading(false);
    }
  }, [canRead, load]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.stage.toLowerCase().includes(q)
    );
  }, [rows, filter]);

  const setFlag = async (name: string, enabled: boolean) => {
    try {
      await getBackendSrv().put(`/api/admin/labs/feature-toggles/${encodeURIComponent(name)}`, { enabled });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const clearOverride = async (name: string) => {
    try {
      await getBackendSrv().delete(`/api/admin/labs/feature-toggles/${encodeURIComponent(name)}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const columns: Array<Column<LabsFlagRow>> = useMemo(
    () => [
      {
        id: 'name',
        header: t('labs-page.column.name', 'Name'),
        cell: ({ row }) => (
          <Stack direction="column" gap={0.5}>
            <Text weight="bold">{row.original.name}</Text>
            {row.original.description && (
              <Text variant="bodySmall" color="secondary">
                {row.original.description}
              </Text>
            )}
            {(row.original.requiresRestart || row.original.frontendOnly || !row.original.meetsRuntime) && (
              <Stack direction="row" gap={1} wrap>
                {row.original.requiresRestart && (
                  <Text variant="bodySmall" color="warning">
                    <Trans i18nKey="labs-page.badge.restart">Restart may be required for full effect</Trans>
                  </Text>
                )}
                {row.original.frontendOnly && (
                  <Text variant="bodySmall" color="secondary">
                    <Trans i18nKey="labs-page.badge.frontend">Frontend only</Trans>
                  </Text>
                )}
                {!row.original.meetsRuntime && row.original.blockedReason && (
                  <Text variant="bodySmall" color="error">
                    {row.original.blockedReason}
                  </Text>
                )}
              </Stack>
            )}
          </Stack>
        ),
      },
      {
        id: 'stage',
        header: t('labs-page.column.stage', 'Stage'),
        cell: ({ row }) => row.original.stage,
      },
      {
        id: 'source',
        header: t('labs-page.column.source', 'Source'),
        cell: ({ row }) => row.original.source,
      },
      {
        id: 'enabled',
        header: t('labs-page.column.enabled', 'Enabled'),
        cell: ({ row }) => {
          const r = row.original;
          const disabled = !canWrite || !r.writable || !r.meetsRuntime;
          return (
            <Switch
              value={r.enabled}
              disabled={disabled}
              onChange={(e) => void setFlag(r.name, e.currentTarget.checked)}
            />
          );
        },
      },
      {
        id: 'actions',
        header: t('labs-page.column.actions', 'Actions'),
        cell: ({ row }) => {
          const r = row.original;
          if (r.source !== 'labs' || !canWrite) {
            return null;
          }
          return (
            <Button
              size="sm"
              variant="secondary"
              fill="outline"
              onClick={() => void clearOverride(r.name)}
            >
              <Trans i18nKey="labs-page.reset">Reset to inherited</Trans>
            </Button>
          );
        },
      },
    ],
    [canWrite, setFlag, clearOverride]
  );

  if (!contextSrv.user.isGrafanaAdmin || !canRead) {
    return (
      <Page navId="labs">
        <Page.Contents>
          <Alert title={t('labs-page.forbidden.title', 'Access denied')} severity="warning">
            <Trans i18nKey="labs-page.forbidden.body">
              You need Grafana server admin access and feature management permissions to use Labs.
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
          <div>
            <Text element="h1" variant="h2">
              <Trans i18nKey="labs-page.title">Feature flags</Trans>
            </Text>
            <Text color="secondary">
              <Trans i18nKey="labs-page.intro">
                Toggle instance-wide feature flags. Changes apply immediately for flags that do not require a restart.
                For configuration reference, see{' '}
                <TextLink href="https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#feature_toggles">
                  Configure Grafana
                </TextLink>
                .
              </Trans>
            </Text>
          </div>
          {error && (
            <Alert title={t('labs-page.error.title', 'Something went wrong')} severity="error" onRemove={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Field label={t('labs-page.filter.label', 'Search')}>
            <Input
              width={50}
              placeholder={t('labs-page.filter.placeholder', 'Filter by name, description, or stage')}
              value={filter}
              onChange={(e) => setFilter(e.currentTarget.value)}
            />
          </Field>
          <InteractiveTable
            columns={columns}
            data={filtered}
            getRowId={(r) => r.name}
            isLoading={loading}
            emptyMessage={t('labs-page.empty', 'No feature flags match your filter.')}
          />
        </Stack>
      </Page.Contents>
    </Page>
  );
}

export default LabsFeatureTogglesPage;
