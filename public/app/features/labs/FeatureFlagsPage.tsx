import { useCallback, useEffect, useMemo, useState } from 'react';

import { FeatureState } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import {
  Alert,
  Button,
  ConfirmModal,
  type CellProps,
  type Column,
  FeatureBadge,
  InteractiveTable,
  Stack,
  Switch,
  Text,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

export interface ToggleStatus {
  name: string;
  description?: string;
  stage: string;
  enabled: boolean;
  writeable: boolean;
  source?: { name?: string };
  warning?: string;
}

export interface ResolvedToggleState {
  allowEditing: boolean;
  restartRequired: boolean;
  enabled: Record<string, boolean>;
  toggles: ToggleStatus[];
}

interface PendingToggle {
  name: string;
  enabled: boolean;
}

function stageToFeatureState(stage: string): FeatureState | undefined {
  switch (stage) {
    case 'experimental':
      return FeatureState.experimental;
    case 'privatePreview':
      return FeatureState.privatePreview;
    case 'preview':
      return FeatureState.preview;
    default:
      return undefined;
  }
}

function isExperimentalStage(stage: string) {
  return stage === 'experimental' || stage === 'privatePreview';
}

async function fetchResolvedState(): Promise<ResolvedToggleState> {
  return getBackendSrv().get<ResolvedToggleState>('/api/admin/feature-toggles/resolved');
}

async function updateFeatureToggle(name: string, enabled: boolean): Promise<void> {
  await getBackendSrv().post('/api/admin/feature-toggles', { name, enabled });
}

async function resetFeatureToggle(name: string): Promise<void> {
  await getBackendSrv().delete(`/api/admin/feature-toggles?name=${encodeURIComponent(name)}`);
}

function FeatureFlagsPage() {
  const [state, setState] = useState<ResolvedToggleState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadSuggested, setReloadSuggested] = useState(false);

  const canWrite = contextSrv.hasPermission(AccessControlAction.FeatureManagementWrite);

  const loadState = useCallback(async () => {
    try {
      setLoadError(null);
      const next = await fetchResolvedState();
      setState(next);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load feature flags');
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const applyToggle = useCallback(
    async (name: string, enabled: boolean) => {
      setIsSaving(true);
      try {
        await updateFeatureToggle(name, enabled);
        setReloadSuggested(true);
        await loadState();
      } finally {
        setIsSaving(false);
        setPendingToggle(null);
      }
    },
    [loadState]
  );

  const handleToggleRequest = useCallback(
    (toggle: ToggleStatus, enabled: boolean) => {
      if (!canWrite || !toggle.writeable) {
        return;
      }

      if (isExperimentalStage(toggle.stage)) {
        setPendingToggle({ name: toggle.name, enabled });
        return;
      }

      applyToggle(toggle.name, enabled);
    },
    [applyToggle, canWrite]
  );

  const handleReset = useCallback(
    async (name: string) => {
      setIsSaving(true);
      try {
        await resetFeatureToggle(name);
        setReloadSuggested(true);
        await loadState();
      } finally {
        setIsSaving(false);
      }
    },
    [loadState]
  );

  const columns = useMemo<Array<Column<ToggleStatus>>>(
    () => [
      {
        id: 'name',
        header: t('labs.feature-flags.columns.name', 'Flag'),
        cell: ({ row: { original } }: CellProps<ToggleStatus, string>) => (
          <Stack direction="column" gap={0.5}>
            <Text weight="medium">{original.name}</Text>
            {original.description && (
              <Text variant="bodySmall" color="secondary">
                {original.description}
              </Text>
            )}
          </Stack>
        ),
      },
      {
        id: 'stage',
        header: t('labs.feature-flags.columns.stage', 'Stage'),
        cell: ({ row: { original } }: CellProps<ToggleStatus, string>) => {
          const featureState = stageToFeatureState(original.stage);
          return featureState ? <FeatureBadge featureState={featureState} /> : <Text>{original.stage}</Text>;
        },
      },
      {
        id: 'enabled',
        header: t('labs.feature-flags.columns.enabled', 'Enabled'),
        cell: ({ row: { original } }: CellProps<ToggleStatus, boolean>) => (
          <Switch
            value={original.enabled}
            disabled={!canWrite || !original.writeable || isSaving}
            aria-label={original.name}
            onChange={(event) => handleToggleRequest(original, event.currentTarget.checked)}
          />
        ),
      },
      {
        id: 'status',
        header: t('labs.feature-flags.columns.status', 'Status'),
        cell: ({ row: { original } }: CellProps<ToggleStatus, string>) => {
          if (original.source?.name === 'config') {
            return <Text color="secondary">{t('labs.feature-flags.locked', 'Locked by configuration')}</Text>;
          }
          if (original.warning) {
            return <Text color="secondary">{original.warning}</Text>;
          }
          if (original.source?.name === 'database') {
            return (
              <Stack direction="row" gap={1} alignItems="center">
                <Text color="secondary">{t('labs.feature-flags.overridden', 'Overridden')}</Text>
                {canWrite && original.writeable && (
                  <Button size="sm" variant="secondary" fill="outline" onClick={() => handleReset(original.name)}>
                    {t('labs.feature-flags.reset', 'Reset')}
                  </Button>
                )}
              </Stack>
            );
          }
          return null;
        },
      },
    ],
    [canWrite, handleReset, handleToggleRequest, isSaving]
  );

  return (
    <Page navId="labs">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Text variant="h3">
            <Trans i18nKey="labs.feature-flags.title">Feature flags</Trans>
          </Text>
          <Text color="secondary">
            <Trans i18nKey="labs.feature-flags.description">
              Discover and manage feature flags for this Grafana instance. Changes are persisted server-side. Some
              flags require a Grafana restart or browser reload to take full effect.
            </Trans>
          </Text>

          {state?.restartRequired && (
            <Alert severity="warning" title={t('labs.feature-flags.restart-required-title', 'Restart required')}>
              <Trans i18nKey="labs.feature-flags.restart-required-body">
                One or more flags have pending changes that require a Grafana restart before they take effect.
              </Trans>
            </Alert>
          )}

          {reloadSuggested && (
            <Alert severity="info" title={t('labs.feature-flags.reload-title', 'Reload recommended')}>
              <Stack direction="row" gap={1} alignItems="center">
                <Trans i18nKey="labs.feature-flags.reload-body">
                  Reload Grafana in your browser so frontend feature flags pick up the latest values.
                </Trans>
                <Button onClick={() => window.location.reload()}>
                  {t('labs.feature-flags.reload-button', 'Reload Grafana')}
                </Button>
              </Stack>
            </Alert>
          )}

          {!canWrite && (
            <Alert severity="info" title={t('labs.feature-flags.read-only-title', 'Read-only access')}>
              <Trans i18nKey="labs.feature-flags.read-only-body">
                You can view feature flags but do not have permission to change them.
              </Trans>
            </Alert>
          )}

          {loadError && (
            <Alert severity="error" title={t('labs.feature-flags.load-error-title', 'Failed to load feature flags')}>
              {loadError}
            </Alert>
          )}

          {state && (
            <InteractiveTable data={state.toggles} columns={columns} getRowId={(row) => row.name} pageSize={25} />
          )}
        </Stack>

        {pendingToggle && (
          <ConfirmModal
            isOpen
            title={t('labs.feature-flags.confirm-title', 'Enable experimental feature?')}
            body={t(
              'labs.feature-flags.confirm-body',
              'This feature is still early — behavior may change or break. Are you sure you want to continue?'
            )}
            confirmText={t('labs.feature-flags.confirm-continue', 'Continue')}
            onConfirm={() => applyToggle(pendingToggle.name, pendingToggle.enabled)}
            onDismiss={() => setPendingToggle(null)}
          />
        )}
      </Page.Contents>
    </Page>
  );
}

export default FeatureFlagsPage;
