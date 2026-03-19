import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import {
  Alert,
  Badge,
  CellProps,
  Column,
  FilterInput,
  InteractiveTable,
  LoadingPlaceholder,
  Stack,
  Text,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

export interface LabsFeatureToggleStatus {
  name: string;
  description?: string;
  stage: string;
  enabled: boolean;
  requiresDevMode?: boolean;
  frontend?: boolean;
  hideFromDocs?: boolean;
  requiresRestart?: boolean;
  warning?: string;
}

interface LabsFeatureFlagsResponse {
  toggles: LabsFeatureToggleStatus[];
}

type Cell<T extends keyof LabsFeatureToggleStatus = keyof LabsFeatureToggleStatus> = CellProps<
  LabsFeatureToggleStatus,
  LabsFeatureToggleStatus[T]
>;

export function LabsFeatureFlagsTable({ toggles }: { toggles: LabsFeatureToggleStatus[] }) {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');

  const filteredToggles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return toggles;
    }

    return toggles.filter((toggle) =>
      [
        toggle.name,
        toggle.description ?? '',
        toggle.stage,
        toggle.warning ?? '',
        toggle.enabled ? 'enabled' : 'disabled',
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [query, toggles]);

  const columns = useMemo<Array<Column<LabsFeatureToggleStatus>>>(
    () => [
      {
        id: 'name',
        header: t('labs.feature-flags-table.columns.name', 'Name'),
        cell: ({ cell: { value } }: Cell<'name'>) => <Text>{value}</Text>,
        sortType: 'string',
      },
      {
        id: 'enabled',
        header: t('labs.feature-flags-table.columns.enabled', 'Enabled'),
        cell: ({ cell: { value } }: Cell<'enabled'>) => (
          <Badge
            text={value ? t('labs.feature-flags-table.enabled', 'Enabled') : t('labs.feature-flags-table.disabled', 'Disabled')}
            color={value ? 'green' : 'blue'}
          />
        ),
      },
      {
        id: 'stage',
        header: t('labs.feature-flags-table.columns.stage', 'Stage'),
        cell: ({ cell: { value } }: Cell<'stage'>) => <Text>{value}</Text>,
        sortType: 'string',
      },
      {
        id: 'description',
        header: t('labs.feature-flags-table.columns.description', 'Description'),
        cell: ({ row: { original } }: Cell<'description'>) => (
          <Stack direction="column" gap={0}>
            <Text>{original.description || t('labs.feature-flags-table.no-description', 'No description provided')}</Text>
            {original.warning && <Text color="warning">{original.warning}</Text>}
          </Stack>
        ),
        sortType: 'string',
      },
      {
        id: 'metadata',
        header: t('labs.feature-flags-table.columns.metadata', 'Metadata'),
        cell: ({ row: { original } }: Cell) => (
          <Stack wrap="wrap" gap={0.5}>
            {original.frontend && (
              <Badge text={t('labs.feature-flags-table.frontend-only', 'Frontend only')} color="blue" />
            )}
            {original.requiresRestart && (
              <Badge text={t('labs.feature-flags-table.restart-required', 'Restart required')} color="orange" />
            )}
            {original.requiresDevMode && (
              <Badge text={t('labs.feature-flags-table.dev-mode-only', 'Dev mode only')} color="purple" />
            )}
            {original.hideFromDocs && (
              <Badge text={t('labs.feature-flags-table.hidden-from-docs', 'Hidden from docs')} color="red" />
            )}
          </Stack>
        ),
      },
    ],
    []
  );

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.actionBar}>
        <FilterInput
          placeholder={t(
            'labs.feature-flags-table.filter-placeholder',
            'Search by name, description, stage, warning, or status'
          )}
          value={query}
          onChange={setQuery}
          escapeRegex={false}
        />
        <Text color="secondary">
          <Trans i18nKey="labs.feature-flags-table.results-count">
            {{ count: filteredToggles.length }} of {{ total: toggles.length }} feature flags
          </Trans>
        </Text>
      </div>
      <InteractiveTable columns={columns} data={filteredToggles} getRowId={(row) => row.name} />
    </Stack>
  );
}

export default function LabsFeatureFlagsPage() {
  const { loading, error, value } = useAsync(
    () => getBackendSrv().get<LabsFeatureFlagsResponse>('/api/labs/feature-toggles'),
    []
  );

  return (
    <Page navId="labs">
      <Page.Contents>
        <Alert severity="info" title={t('labs.feature-flags-page.info-title', 'Feature flag inventory')}>
          <Trans i18nKey="labs.feature-flags-page.info-description">
            This page lists every registered Grafana feature flag, including internal and development-only entries.
          </Trans>
        </Alert>

        {loading && (
          <LoadingPlaceholder
            text={t('labs.feature-flags-page.loading-placeholder', 'Loading feature flags...')}
          />
        )}

        {error && (
          <Alert severity="error" title={t('labs.feature-flags-page.error-title', 'Failed to load feature flags')}>
            {error instanceof Error
              ? error.message
              : t('labs.feature-flags-page.error-fallback', 'An unexpected error occurred.')}
          </Alert>
        )}

        {value && <LabsFeatureFlagsTable toggles={value.toggles} />}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  actionBar: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
  }),
});
