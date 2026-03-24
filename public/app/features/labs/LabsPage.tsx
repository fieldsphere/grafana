import { css } from '@emotion/css';
import { useMemo, useState } from 'react';

import { FeatureState, GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Badge, EmptyState, FeatureBadge, FilterInput, InteractiveTable, Stack, Text, useStyles2 } from '@grafana/ui';
import config from 'app/core/config';
import { Page } from 'app/core/components/Page/Page';

type LabsFeatureRow = {
  name: string;
  description: string;
  stage?: string;
  enabled: boolean;
};

const stageToFeatureState: Record<string, FeatureState | undefined> = {
  experimental: FeatureState.experimental,
  privatePreview: FeatureState.privatePreview,
  preview: FeatureState.preview,
};

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');

  const features = useMemo<LabsFeatureRow[]>(() => {
    return [...config.featureToggleList]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((feature) => ({
        name: feature.name,
        description: feature.description ?? '',
        stage: feature.stage,
        enabled: feature.enabled,
      }));
  }, []);

  const filteredFeatures = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return features;
    }

    return features.filter((feature) => {
      return (
        feature.name.toLowerCase().includes(normalizedQuery) ||
        feature.description.toLowerCase().includes(normalizedQuery) ||
        feature.stage?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [features, query]);

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: t('labs.page.column-name', 'Feature flag'),
        sortType: 'alphanumeric' as const,
        cell: ({ cell: { value } }: { cell: { value: string } }) => <Text element="span">{value}</Text>,
      },
      {
        id: 'status',
        header: t('labs.page.column-status', 'Status'),
        cell: ({ row }: { row: { original: LabsFeatureRow } }) =>
          row.original.enabled ? (
            <Badge text={t('labs.page.enabled', 'Enabled')} color="green" />
          ) : (
            <Badge text={t('labs.page.disabled', 'Disabled')} color="darkgrey" />
          ),
      },
      {
        id: 'stage',
        header: t('labs.page.column-stage', 'Stage'),
        cell: ({ row }: { row: { original: LabsFeatureRow } }) => {
          const stage = row.original.stage;
          const featureState = stage ? stageToFeatureState[stage] : undefined;

          if (!stage) {
            return <Text color="secondary">{t('labs.page.stage-not-set', 'Not set')}</Text>;
          }

          if (featureState) {
            return <FeatureBadge featureState={featureState} />;
          }

          return <Text>{stage}</Text>;
        },
      },
      {
        id: 'description',
        header: t('labs.page.column-description', 'Description'),
        cell: ({ cell: { value } }: { cell: { value: string } }) =>
          value ? <Text color="secondary">{value}</Text> : <Text color="secondary">{t('labs.page.no-description', 'No description')}</Text>,
      },
    ],
    []
  );

  return (
    <Page
      navId="labs"
      subTitle={t(
        'labs.page.subtitle',
        'Review Grafana feature flags and whether they are currently enabled for this instance.'
      )}
    >
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <FilterInput
            className={styles.filterInput}
            placeholder={t('labs.page.search-placeholder', 'Search feature flags')}
            autoFocus
            value={query}
            onChange={setQuery}
          />

          {filteredFeatures.length === 0 ? (
            <EmptyState
              variant="not-found"
              message={t('labs.page.empty-state', 'No feature flags found')}
            />
          ) : (
            <InteractiveTable
              columns={columns}
              data={filteredFeatures}
              getRowId={(row) => row.name}
              pageSize={25}
            />
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  filterInput: css({
    maxWidth: theme.spacing(50),
  }),
});
