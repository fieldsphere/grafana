import { useCallback, useEffect, useMemo, useState } from 'react';

import { t, Trans } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import {
  Alert,
  Badge,
  type CellProps,
  type Column,
  InteractiveTable,
  Spinner,
  Stack,
  Switch,
  Text,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { getLocalFeatureToggleOverrides, isBrowserToggleable, setLocalFeatureToggle } from './featureToggleStorage';

export interface RegisteredFeatureFlagDTO {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
  expression?: string;
  requiresDevMode?: boolean;
  frontendOnly?: boolean;
  requiresRestart?: boolean;
}

type FeatureFlagRow = RegisteredFeatureFlagDTO & {
  browserToggleable: boolean;
};

function getLimitationLabel(flag: RegisteredFeatureFlagDTO): string | undefined {
  if (flag.requiresRestart) {
    return t('labs-page.limitation-restart', 'Requires server restart');
  }
  if (!flag.frontendOnly) {
    return t('labs-page.limitation-server', 'Server configuration only');
  }
  if (flag.requiresDevMode) {
    return t('labs-page.limitation-dev-mode', 'Development mode only');
  }
  return undefined;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlagRow[] | undefined>();
  const [error, setError] = useState<string>();
  const [reloadNotice, setReloadNotice] = useState(false);

  useEffect(() => {
    getBackendSrv()
      .get<RegisteredFeatureFlagDTO[]>('/api/featuremgmt/registered-flags')
      .then((data) => {
        const overrides = getLocalFeatureToggleOverrides();
        setFlags(
          data.map((flag) => ({
            ...flag,
            enabled: overrides[flag.name] ?? flag.enabled,
            browserToggleable: isBrowserToggleable(flag),
          }))
        );
      })
      .catch(() => setError(t('labs-page.load-error', 'Could not load feature flags')));
  }, []);

  const onToggle = useCallback((flag: FeatureFlagRow, enabled: boolean) => {
    setLocalFeatureToggle(flag.name, enabled);
    setFlags((current) =>
      current?.map((row) => (row.name === flag.name ? { ...row, enabled } : row))
    );
    setReloadNotice(true);
  }, []);

  const columns = useMemo<Array<Column<FeatureFlagRow>>>(
    () => [
      {
        id: 'name',
        header: t('labs-page.column-name', 'Feature flag'),
      },
      {
        id: 'enabled',
        header: t('labs-page.column-enabled', 'Enabled'),
        cell: ({ row }: CellProps<FeatureFlagRow>) => {
          if (row.original.browserToggleable) {
            return (
              <Switch
                value={row.original.enabled}
                onChange={(event) => onToggle(row.original, event.currentTarget.checked)}
                aria-label={row.original.name}
              />
            );
          }

          return (
            <Badge
              color={row.original.enabled ? 'green' : 'red'}
              text={row.original.enabled ? t('labs-page.enabled-yes', 'On') : t('labs-page.enabled-no', 'Off')}
            />
          );
        },
      },
      {
        id: 'stage',
        header: t('labs-page.column-stage', 'Stage'),
      },
      {
        id: 'limitation',
        header: t('labs-page.column-limitation', 'Limitation'),
        cell: ({ row }: CellProps<FeatureFlagRow>) => {
          const label = getLimitationLabel(row.original);
          return label ? <Badge color="orange" text={label} /> : null;
        },
      },
      {
        id: 'description',
        header: t('labs-page.column-description', 'Description'),
      },
    ],
    [onToggle]
  );

  return (
    <Page navId="labs-feature-flags">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Alert severity="warning" title={t('labs-page.warning-title', 'Experimental features')}>
            <Trans i18nKey="labs-page.warning-body">
              Labs features may be unstable or incomplete. Use them for evaluation only. Some flags are controlled by
              server configuration and cannot be changed from the UI.
            </Trans>
          </Alert>

          {reloadNotice && (
            <Alert severity="info" title={t('labs-page.reload-title', 'Reload required')}>
              <Trans i18nKey="labs-page.reload-body">
                Browser-side flag changes take effect after you reload the page.
              </Trans>
            </Alert>
          )}

          <Text element="p">
            <Trans i18nKey="labs-page.intro">
              Feature toggles registered in this Grafana build. Frontend-only flags can be toggled in your browser;
              server flags reflect instance configuration.
            </Trans>
          </Text>

          {error && <Alert title={error} severity="error" />}

          {flags === undefined ? (
            <Spinner />
          ) : flags.length === 0 ? (
            <Text element="p">
              <Trans i18nKey="labs-page.empty">No feature flags are registered for this build.</Trans>
            </Text>
          ) : (
            <InteractiveTable columns={columns} data={flags} getRowId={(row) => row.name} />
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}
