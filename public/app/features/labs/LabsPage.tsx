import { css } from '@emotion/css';
import { useMemo } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Badge, EmptyState, InteractiveTable, LoadingPlaceholder, Stack, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

interface LabsFeatureToggleDTO {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
  frontendOnly: boolean;
  hideFromDocs: boolean;
  requiresDevMode: boolean;
  requiresRestart: boolean;
  expression: string;
}

interface LabsFeatureTogglesResponse {
  activeCount: number;
  availableCount: number;
  toggles: LabsFeatureToggleDTO[];
}

const getLabsFeatureToggles = async (): Promise<LabsFeatureTogglesResponse> => {
  return getBackendSrv().get('/api/labs/feature-toggles');
};

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const { value, loading, error } = useAsync(async () => getLabsFeatureToggles(), []);

  const activeToggles = useMemo(() => value?.toggles.filter((toggle) => toggle.enabled) ?? [], [value]);

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: t('labs.table.name', 'Feature flag'),
        accessor: 'name',
      },
      {
        id: 'status',
        header: t('labs.table.status', 'Status'),
        cell: ({ row }: { row: { original: LabsFeatureToggleDTO } }) => (
          <Badge
            text={row.original.enabled ? t('labs.status.active', 'Active') : t('labs.status.available', 'Available')}
            color={row.original.enabled ? 'green' : 'blue'}
          />
        ),
      },
      {
        id: 'stage',
        header: t('labs.table.stage', 'Stage'),
        cell: ({ row }: { row: { original: LabsFeatureToggleDTO } }) => (
          <span className={styles.noWrap}>{formatStage(row.original.stage)}</span>
        ),
      },
      {
        id: 'description',
        header: t('labs.table.description', 'Description'),
        cell: ({ row }: { row: { original: LabsFeatureToggleDTO } }) => (
          <div className={styles.description}>{row.original.description || t('labs.empty.description', 'No description')}</div>
        ),
      },
      {
        id: 'details',
        header: t('labs.table.details', 'Details'),
        cell: ({ row }: { row: { original: LabsFeatureToggleDTO } }) => (
          <div className={styles.badges}>
            {row.original.frontendOnly && (
              <Badge text={t('labs.badge.frontend-only', 'Frontend only')} color="purple" className={styles.noWrap} />
            )}
            {row.original.requiresDevMode && (
              <Badge text={t('labs.badge.dev-mode', 'Dev mode')} color="orange" className={styles.noWrap} />
            )}
            {row.original.requiresRestart && (
              <Badge text={t('labs.badge.restart', 'Restart required')} color="orange" className={styles.noWrap} />
            )}
          </div>
        ),
      },
    ],
    [styles.badges, styles.description, styles.noWrap]
  );

  return (
    <Page
      navId="labs"
      renderTitle={(title) => (
        <div className={styles.title}>
          <h1>{title}</h1>
          <Badge text={t('labs.badge.new', 'New')} color="blue" icon="rocket" />
        </div>
      )}
      subTitle={t(
        'labs.subtitle.custom',
        'Discover which feature flags are currently active and which experimental options are available in this Grafana instance.'
      )}
    >
      <Page.Contents>
        <div className={styles.content}>
          {loading && <LoadingPlaceholder text={t('labs.loading', 'Loading feature flags...')} />}

          {error && (
            <Alert title={t('labs.error.title', 'Failed to load Labs')} severity="error">
              {t(
                'labs.error.message',
                'An unexpected error occurred while loading feature flags. Refresh the page to try again.'
              )}
            </Alert>
          )}

          {!loading && !error && value && (
            <>
              <section className={styles.summaryGrid}>
                <SummaryCard
                  title={t('labs.summary.active', 'Active feature flags')}
                  value={String(value.activeCount)}
                  description={t('labs.summary.active.description', 'Currently enabled in this Grafana instance')}
                />
                <SummaryCard
                  title={t('labs.summary.available', 'Available feature flags')}
                  value={String(value.availableCount)}
                  description={t('labs.summary.available.description', 'Registered and ready to be enabled')}
                />
              </section>

              <section>
                <Text element="h3">{t('labs.active.heading', 'Active flags')}</Text>
                {activeToggles.length === 0 ? (
                  <EmptyState
                    variant="not-found"
                    message={t('labs.active.empty', 'No feature flags are currently active')}
                  />
                ) : (
                  <div className={styles.activeList}>
                    {activeToggles.map((toggle) => (
                      <div key={toggle.name} className={styles.activeCard}>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Text element="h4">{toggle.name}</Text>
                          <Badge text={formatStage(toggle.stage)} color="green" />
                        </Stack>
                        <Text color="secondary">{toggle.description || t('labs.empty.description', 'No description')}</Text>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <Text element="h3">{t('labs.available.heading', 'All available flags')}</Text>
                <InteractiveTable columns={columns} data={value.toggles} getRowId={(toggle) => toggle.name} />
              </section>
            </>
          )}
        </div>
      </Page.Contents>
    </Page>
  );
}

function SummaryCard({ title, value, description }: { title: string; value: string; description: string }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.summaryCard}>
      <Text element="h4">{title}</Text>
      <div className={styles.summaryValue}>{value}</div>
      <Text color="secondary">{description}</Text>
    </div>
  );
}

function formatStage(stage: string) {
  switch (stage) {
    case 'preview':
      return t('labs.stage.preview', 'Preview');
    case 'privatePreview':
      return t('labs.stage.private-preview', 'Private preview');
    case 'experimental':
      return t('labs.stage.experimental', 'Experimental');
    case 'deprecated':
      return t('labs.stage.deprecated', 'Deprecated');
    case 'GA':
      return t('labs.stage.ga', 'GA');
    default:
      return stage;
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  content: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
  }),
  title: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    h1: {
      marginBottom: 0,
    },
  }),
  summaryGrid: css({
    display: 'grid',
    gap: theme.spacing(2),
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  }),
  summaryCard: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    background: theme.colors.background.secondary,
  }),
  summaryValue: css({
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: 1,
  }),
  activeList: css({
    display: 'grid',
    gap: theme.spacing(2),
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    marginTop: theme.spacing(2),
  }),
  activeCard: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  badges: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
  }),
  description: css({
    minWidth: 0,
  }),
  noWrap: css({
    whiteSpace: 'nowrap',
  }),
});
