import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import {
  Badge,
  FilterInput,
  type CellProps,
  type Column,
  InteractiveTable,
  Stack,
  Text,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { type LabsFeatureToggle } from './types';

type Cell<T extends keyof LabsFeatureToggle = keyof LabsFeatureToggle> = CellProps<LabsFeatureToggle, LabsFeatureToggle[T]>;

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const { loading, value: featureToggles = [] } = useAsync(
    () => getBackendSrv().get<LabsFeatureToggle[]>('/api/labs/feature-toggles'),
    []
  );

  const filteredToggles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return featureToggles;
    }

    return featureToggles.filter((toggle) => {
      return (
        toggle.name.toLowerCase().includes(normalizedQuery) ||
        toggle.description.toLowerCase().includes(normalizedQuery) ||
        toggle.stage.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [featureToggles, query]);

  const columns: Array<Column<LabsFeatureToggle>> = useMemo(
    () => [
      {
        id: 'name',
        header: t('labs.feature-toggles.name', 'Name'),
        cell: ({ cell: { value } }: Cell<'name'>) => <Text weight="medium">{value}</Text>,
      },
      {
        id: 'description',
        header: t('labs.feature-toggles.description', 'Description'),
        cell: ({ cell: { value } }: Cell<'description'>) => value || '—',
      },
      {
        id: 'stage',
        header: t('labs.feature-toggles.stage', 'Stage'),
        cell: ({ cell: { value } }: Cell<'stage'>) => <Badge text={value} color="blue" />,
      },
      {
        id: 'enabled',
        header: t('labs.feature-toggles.enabled', 'Enabled'),
        cell: ({ cell: { value } }: Cell<'enabled'>) => (
          <Badge
            text={value ? t('labs.feature-toggles.on', 'On') : t('labs.feature-toggles.off', 'Off')}
            color={value ? 'green' : 'red'}
          />
        ),
      },
    ],
    []
  );

  const subTitle = (
    <Trans i18nKey="labs.page.subtitle">
      Browse all feature flags configured in this Grafana instance. Feature flags control experimental and in-development
      functionality across the platform.
    </Trans>
  );

  return (
    <Page navId="labs" subTitle={subTitle}>
      <Page.Contents isLoading={loading}>
        <Stack direction="column" gap={2}>
          <FilterInput
            placeholder={t('labs.feature-toggles.search-placeholder', 'Search feature flags')}
            value={query}
            onChange={setQuery}
          />
          <Text variant="bodySmall" color="secondary">
            <Trans i18nKey="labs.feature-toggles.count" values={{ count: filteredToggles.length }}>
              {'Showing {{count}} feature flags'}
            </Trans>
          </Text>
          <div className={styles.tableWrapper}>
            <InteractiveTable
              columns={columns}
              data={filteredToggles}
              getRowId={(toggle) => toggle.name}
              pageSize={25}
            />
          </div>
        </Stack>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  tableWrapper: css({
    width: '100%',
  }),
});
