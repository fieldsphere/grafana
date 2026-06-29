import { useCallback, useMemo, useState } from 'react';

import { Trans, t } from '@grafana/i18n';
import { Alert, Button, type CellProps, type Column, InteractiveTable, Stack, Switch, Text } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import config from 'app/core/config';

import {
  type FeatureFlagEntry,
  getFeatureFlagEntries,
  readFeatureToggleOverridesFromLocalStorage,
  removeFeatureToggleOverride,
  setFeatureToggleOverride,
  writeFeatureToggleOverridesToLocalStorage,
} from './featureFlagOverrides';

function FeatureFlagsPage() {
  const [overrides, setOverrides] = useState(() => readFeatureToggleOverridesFromLocalStorage());
  const [pendingReload, setPendingReload] = useState(false);

  const entries = useMemo(
    () => getFeatureFlagEntries(config.featureToggles as Record<string, boolean>, overrides),
    [overrides]
  );

  const persistOverrides = useCallback((nextOverrides: Record<string, boolean>) => {
    writeFeatureToggleOverridesToLocalStorage(nextOverrides);
    setOverrides(nextOverrides);
    setPendingReload(true);
  }, []);

  const handleToggle = useCallback(
    (name: string, value: boolean) => {
      persistOverrides(setFeatureToggleOverride(overrides, name, value));
    },
    [overrides, persistOverrides]
  );

  const handleReset = useCallback(
    (name: string) => {
      persistOverrides(removeFeatureToggleOverride(overrides, name));
    },
    [overrides, persistOverrides]
  );

  const columns = useMemo<Array<Column<FeatureFlagEntry>>>(
    () => [
      {
        id: 'name',
        header: t('labs.feature-flags.columns.name', 'Flag'),
      },
      {
        id: 'bootValue',
        header: t('labs.feature-flags.columns.boot-value', 'Boot value'),
        cell: ({ cell: { value } }: CellProps<FeatureFlagEntry, boolean>) => (
          <Text>{value ? t('labs.feature-flags.enabled', 'Enabled') : t('labs.feature-flags.disabled', 'Disabled')}</Text>
        ),
      },
      {
        id: 'hasOverride',
        header: t('labs.feature-flags.columns.override', 'Override'),
        cell: ({ row: { original } }: CellProps<FeatureFlagEntry, boolean>) => (
          <Text>
            {original.hasOverride
              ? original.effectiveValue
                ? t('labs.feature-flags.enabled', 'Enabled')
                : t('labs.feature-flags.disabled', 'Disabled')
              : t('labs.feature-flags.default', 'Default')}
          </Text>
        ),
      },
      {
        id: 'effectiveValue',
        header: t('labs.feature-flags.columns.toggle', 'Toggle'),
        cell: ({ row: { original } }: CellProps<FeatureFlagEntry, boolean>) => (
          <Switch
            value={original.effectiveValue}
            onChange={({ currentTarget }) => handleToggle(original.name, currentTarget.checked)}
          />
        ),
      },
      {
        id: 'actions',
        header: t('labs.feature-flags.columns.actions', 'Actions'),
        cell: ({ row: { original } }: CellProps<FeatureFlagEntry, string>) => (
          <Button
            size="sm"
            variant="secondary"
            disabled={!original.hasOverride}
            onClick={() => handleReset(original.name)}
          >
            <Trans i18nKey="labs.feature-flags.reset">Reset</Trans>
          </Button>
        ),
      },
    ],
    [handleReset, handleToggle]
  );

  return (
    <Page navId="labs-feature-flags">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Alert severity="info" title={t('labs.feature-flags.info-title', 'Browser-local feature flag overrides')}>
            <Trans i18nKey="labs.feature-flags.info-description">
              These overrides are stored in your browser and are not saved to the Grafana server. Reload Grafana after
              changing flags so they take effect.
            </Trans>
          </Alert>

          {pendingReload && (
            <Alert severity="warning" title={t('labs.feature-flags.reload-title', 'Reload required')}>
              <Stack direction="column" gap={1}>
                <Text>
                  <Trans i18nKey="labs.feature-flags.reload-description">
                    Your browser-local overrides were saved. Reload Grafana to apply them.
                  </Trans>
                </Text>
                <Button icon="repeat" onClick={() => window.location.reload()}>
                  <Trans i18nKey="labs.feature-flags.reload-button">Reload Grafana</Trans>
                </Button>
              </Stack>
            </Alert>
          )}

          <InteractiveTable columns={columns} data={entries} getRowId={(entry) => entry.name} />
        </Stack>
      </Page.Contents>
    </Page>
  );
}

export default FeatureFlagsPage;
