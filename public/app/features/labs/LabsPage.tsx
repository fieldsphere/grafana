import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import {
  Alert,
  Badge,
  FilterInput,
  InteractiveTable,
  LoadingPlaceholder,
  Stack,
  TextLink,
  useStyles2,
  type Column,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

type LabsToggle = {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
  warning?: string;
};

type LabsFeatureTogglesResponse = {
  toggles: LabsToggle[];
};

function getStyles(theme: GrafanaTheme2) {
  return {
    controls: css({
      marginBottom: theme.spacing(2),
      maxWidth: theme.spacing(40),
    }),
    loader: css({
      display: 'flex',
      justifyContent: 'center',
    }),
    meta: css({
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing(2),
    }),
    nameCell: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
    }),
    muted: css({
      color: theme.colors.text.secondary,
    }),
    noWrap: css({
      whiteSpace: 'nowrap',
    }),
  };
}

const collator = new Intl.Collator();

const stageLabels: Record<string, string> = {
  GA: 'GA',
  preview: 'Preview',
  privatePreview: 'Private preview',
  experimental: 'Experimental',
  deprecated: 'Deprecated',
  unknown: 'Unknown',
};

const stageColors: Record<string, 'blue' | 'orange' | 'purple' | 'red' | 'darkgrey' | 'green'> = {
  GA: 'green',
  preview: 'blue',
  privatePreview: 'purple',
  experimental: 'orange',
  deprecated: 'red',
  unknown: 'darkgrey',
};

function getStageLabel(stage: string) {
  return stageLabels[stage] ?? stage || 'Unknown';
}

function getStageColor(stage: string): 'blue' | 'orange' | 'purple' | 'red' | 'darkgrey' | 'green' {
  return stageColors[stage] ?? 'darkgrey';
}

function statusToSearch(toggle: LabsToggle) {
  return [toggle.name, toggle.description, toggle.stage, toggle.warning, toggle.enabled ? 'enabled' : 'disabled']
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');

  const { value, loading, error } = useAsync(async () => {
    return await getBackendSrv().get<LabsFeatureTogglesResponse>('/api/labs/feature-toggles');
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredToggles = useMemo(() => {
    const toggles = value?.toggles ?? [];

    if (!normalizedQuery) {
      return toggles;
    }

    return toggles.filter((toggle) => statusToSearch(toggle).includes(normalizedQuery));
  }, [normalizedQuery, value?.toggles]);

  const columns = useMemo<Array<Column<LabsToggle>>>(
    () => [
      {
        id: 'name',
        header: t('labs.table.column.flag', 'Flag'),
        sortType: (a, b) => collator.compare(a.original.name, b.original.name),
        cell: ({ row }) => (
          <div className={styles.nameCell}>
            <strong>{row.original.name}</strong>
            {row.original.warning && <span className={styles.muted}>{row.original.warning}</span>}
          </div>
        ),
      },
      {
        id: 'enabled',
        header: t('labs.table.column.status', 'Status'),
        disableGrow: true,
        sortType: (a, b) => Number(b.original.enabled) - Number(a.original.enabled),
        cell: ({ row }) => (
          <Badge
            className={styles.noWrap}
            color={row.original.enabled ? 'green' : 'darkgrey'}
            text={row.original.enabled ? t('labs.status.enabled', 'Enabled') : t('labs.status.disabled', 'Disabled')}
          />
        ),
      },
      {
        id: 'stage',
        header: t('labs.table.column.stage', 'Stage'),
        disableGrow: true,
        sortType: (a, b) => collator.compare(getStageLabel(a.original.stage), getStageLabel(b.original.stage)),
        cell: ({ row }) => (
          <Badge
            className={styles.noWrap}
            color={getStageColor(row.original.stage)}
            text={getStageLabel(row.original.stage)}
          />
        ),
      },
      {
        id: 'description',
        header: t('labs.table.column.description', 'Description'),
        sortType: (a, b) => collator.compare(a.original.description ?? '', b.original.description ?? ''),
      },
    ],
    [styles.muted, styles.nameCell, styles.noWrap]
  );

  return (
    <Page
      navId="labs"
      subTitle={
        <>
          {t('labs.subtitle.long', 'Review every registered feature flag in this Grafana instance and its current status.')}
          {' '}
          <TextLink href="https://grafana.com/docs/grafana/latest/administration/feature-toggles/" external>
            {t('labs.docs-link', 'Feature toggle documentation')}
          </TextLink>
        </>
      }
    >
      <Page.Contents>
        <div className={styles.controls}>
          <FilterInput
            placeholder={t('labs.filter.placeholder', 'Filter flags by name, status, stage, or description')}
            value={query}
            onChange={setQuery}
          />
        </div>

        {loading && (
          <div className={styles.loader}>
            <LoadingPlaceholder text={t('common.loading', 'Loading...')} />
          </div>
        )}

        {error && (
          <Alert severity="error" title={t('labs.error.title', 'Failed to load feature flags')}>
            {t(
              'labs.error.body',
              'Grafana could not load the Labs feature flag list. Refresh the page or check the server logs for more details.'
            )}
          </Alert>
        )}

        {!loading && !error && (
          <Stack direction="column" gap={2}>
            <div className={styles.meta}>
              {t('labs.results-count', '{{count}} flags', { count: filteredToggles.length })}
            </div>
            <InteractiveTable columns={columns} data={filteredToggles} getRowId={(toggle) => toggle.name} />
          </Stack>
        )}
      </Page.Contents>
    </Page>
  );
}
