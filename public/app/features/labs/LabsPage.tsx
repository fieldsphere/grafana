import { css } from '@emotion/css';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import {
  Alert,
  Badge,
  InteractiveTable,
  LoadingPlaceholder,
  type CellProps,
  type Column,
  Text,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { ResolvedToggleState, ToggleStatus } from 'app/features/labs/types';

const stageColors: Record<string, 'blue' | 'green' | 'orange' | 'red'> = {
  experimental: 'orange',
  preview: 'blue',
  GA: 'green',
  deprecated: 'red',
};

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const { loading, error, value } = useAsync(
    () => getBackendSrv().get<ResolvedToggleState>('/api/admin/feature-toggles'),
    []
  );

  const columns: Array<Column<ToggleStatus>> = [
    {
      id: 'name',
      header: t('labs.page.columns.name', 'Feature flag'),
      cell: ({ cell }: CellProps<ToggleStatus, string>) => (
        <Text element="span" weight="medium">
          {cell.value}
        </Text>
      ),
      sortType: 'alphanumeric',
    },
    {
      id: 'enabled',
      header: t('labs.page.columns.status', 'Status'),
      cell: ({ cell }: CellProps<ToggleStatus, boolean>) => (
        <Badge
          color={cell.value ? 'green' : 'red'}
          text={cell.value ? t('labs.page.status.enabled', 'Enabled') : t('labs.page.status.disabled', 'Disabled')}
        />
      ),
    },
    {
      id: 'stage',
      header: t('labs.page.columns.stage', 'Stage'),
      cell: ({ cell }: CellProps<ToggleStatus, string>) => (
        <Badge color={stageColors[cell.value] ?? 'blue'} text={cell.value || t('labs.page.stage.unknown', 'unknown')} />
      ),
      sortType: 'alphanumeric',
    },
    {
      id: 'description',
      header: t('labs.page.columns.description', 'Description'),
      cell: ({ cell }: CellProps<ToggleStatus, string>) => (
        <Text color="secondary">{cell.value || t('labs.page.description.empty', 'No description provided')}</Text>
      ),
    },
  ];

  return (
    <Page
      navId="labs"
      subTitle={t(
        'labs.page.subtitle',
        'Review all available feature flags and their current enabled or disabled status for this Grafana instance.'
      )}
    >
      <Page.Contents>
        {value?.restartRequired && (
          <Alert severity="warning" title={t('labs.page.restart-required.title', 'Restart required')} bottomSpacing={2}>
            {t(
              'labs.page.restart-required.message',
              'One or more feature toggle changes require a Grafana restart before they take effect.'
            )}
          </Alert>
        )}

        {loading && (
          <div className={styles.loading}>
            <LoadingPlaceholder text={t('labs.page.loading', 'Loading feature flags...')} />
          </div>
        )}

        {error && (
          <Alert severity="error" title={t('labs.page.error.title', 'Failed to load feature flags')} topSpacing={2}>
            {t(
              'labs.page.error.message',
              'An error occurred while loading feature flag status. Please refresh the page and try again.'
            )}
          </Alert>
        )}

        {value && (
          <div className={styles.tableWrapper}>
            <InteractiveTable
              columns={columns}
              data={value.toggles}
              getRowId={(toggle) => toggle.name}
              pageSize={25}
            />
          </div>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  loading: css({
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4, 0),
  }),
  tableWrapper: css({
    marginTop: theme.spacing(2),
  }),
});
