import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import {
  Alert,
  Badge,
  Box,
  Column,
  EmptyState,
  FilterInput,
  InteractiveTable,
  LoadingPlaceholder,
  Stack,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

type LabsFeatureToggle = {
  name: string;
  description: string;
  stage: string;
  owner?: string;
  enabled: boolean;
  enabledByDefault: boolean;
  frontendOnly: boolean;
  requiresRestart: boolean;
  requiresDevMode: boolean;
  hideFromDocs: boolean;
};

type LabsFeatureTogglesResponse = {
  toggles: LabsFeatureToggle[];
};

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');

  const { value, loading, error } = useAsync(async () => {
    return getBackendSrv().get<LabsFeatureTogglesResponse>('/api/labs/feature-toggles');
  }, []);

  const filteredToggles = useMemo(() => {
    const toggles = value?.toggles ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return toggles;
    }

    return toggles.filter((toggle) =>
      [
        toggle.name,
        toggle.description,
        toggle.stage,
        toggle.owner ?? '',
        toggle.enabled ? 'enabled' : 'disabled',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [query, value]);

  const columns = useMemo<Array<Column<LabsFeatureToggle>>>(
    () => [
      {
        id: 'name',
        header: t('labs.feature-toggles.column-name', 'Name'),
        cell: ({ row }) => row.original.name,
      },
      {
        id: 'status',
        header: t('labs.feature-toggles.column-status', 'Status'),
        cell: ({ row }) => (
          <Badge
            color={row.original.enabled ? 'green' : 'red'}
            text={row.original.enabled ? t('labs.enabled', 'Enabled') : t('labs.disabled', 'Disabled')}
          />
        ),
        disableGrow: true,
      },
      {
        id: 'stage',
        header: t('labs.feature-toggles.column-stage', 'Stage'),
        cell: ({ row }) => row.original.stage,
        disableGrow: true,
      },
      {
        id: 'default',
        header: t('labs.feature-toggles.column-default', 'Default'),
        cell: ({ row }) => (
          <Badge
            color={row.original.enabledByDefault ? 'green' : 'darkgrey'}
            text={
              row.original.enabledByDefault
                ? t('labs.enabled-by-default', 'Enabled by default')
                : t('labs.disabled-by-default', 'Disabled by default')
            }
          />
        ),
        disableGrow: true,
      },
      {
        id: 'owner',
        header: t('labs.feature-toggles.column-owner', 'Owner'),
        cell: ({ row }) => row.original.owner ?? t('labs.no-owner', 'Unknown'),
      },
      {
        id: 'description',
        header: t('labs.feature-toggles.column-description', 'Description'),
        cell: ({ row }) => row.original.description,
      },
      {
        id: 'details',
        header: t('labs.feature-toggles.column-details', 'Details'),
        cell: ({ row }) => {
          const tags = [];

          if (row.original.frontendOnly) {
            tags.push(
              <Badge key="frontend-only" color="blue" text={t('labs.frontend-only', 'Frontend only')} />
            );
          }

          if (row.original.requiresRestart) {
            tags.push(
              <Badge key="requires-restart" color="orange" text={t('labs.requires-restart', 'Requires restart')} />
            );
          }

          if (row.original.requiresDevMode) {
            tags.push(
              <Badge key="requires-dev-mode" color="purple" text={t('labs.requires-dev-mode', 'Requires dev mode')} />
            );
          }

          if (row.original.hideFromDocs) {
            tags.push(
              <Badge key="hidden-from-docs" color="darkgrey" text={t('labs.hidden-from-docs', 'Hidden from docs')} />
            );
          }

          if (tags.length === 0) {
            return null;
          }

          return (
            <Stack direction="row" gap={1}>
              {tags}
            </Stack>
          );
        },
      },
    ],
    []
  );

  return (
    <Page navId="labs" subTitle={t('labs.subtitle', 'Explore all feature flags currently available in this Grafana instance.')}>
      <Page.Contents className={styles.pageContents}>
        <div className={styles.toolbar}>
          <FilterInput
            placeholder={t('labs.search-placeholder', 'Search feature flags')}
            value={query}
            onChange={setQuery}
          />
        </div>

        {loading ? (
          <LoadingPlaceholder text={t('labs.loading', 'Loading feature flags...')} />
        ) : error ? (
          <Alert title={t('labs.error-title', 'Failed to load feature flags')} severity="error">
            <Trans i18nKey="labs.error-description">
              Grafana could not load the Labs feature flag catalog for this instance.
            </Trans>
          </Alert>
        ) : filteredToggles.length === 0 ? (
          <EmptyState
            variant="not-found"
            message={
              query
                ? t('labs.empty-search', 'No feature flags match your search')
                : t('labs.empty', 'No feature flags found')
            }
          />
        ) : (
          <Box className={styles.tableWrap}>
            <InteractiveTable
              columns={columns}
              data={filteredToggles}
              getRowId={(toggle) => toggle.name}
              pageSize={20}
            />
          </Box>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  pageContents: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    height: '100%',
  }),
  toolbar: css({
    maxWidth: theme.spacing(48),
  }),
  tableWrap: css({
    minHeight: 0,
  }),
});
