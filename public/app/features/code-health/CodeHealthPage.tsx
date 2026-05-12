import { css } from '@emotion/css';
import { useMemo, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Field, RadioButtonGroup, Stack, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { MetricCard } from './MetricCard';
import { RecommendedActions } from './RecommendedActions';
import { TrendChart } from './TrendChart';
import { TIME_RANGE_OPTIONS, getMetrics, getRecommendedActions } from './mockData';
import { type TimeRange } from './types';

export function CodeHealthPage() {
  const styles = useStyles2(getStyles);
  const [range, setRange] = useState<TimeRange>('7d');

  const metrics = useMemo(() => getMetrics(range), [range]);
  const actions = useMemo(() => getRecommendedActions(range), [range]);

  const [selectedMetricId, setSelectedMetricId] = useState<string>(metrics[0]?.id ?? '');
  const selectedMetric = useMemo(
    () => metrics.find((metric) => metric.id === selectedMetricId) ?? metrics[0],
    [metrics, selectedMetricId]
  );

  const handleRangeChange = (next: TimeRange) => {
    setRange(next);
    const nextMetrics = getMetrics(next);
    if (!nextMetrics.find((metric) => metric.id === selectedMetricId)) {
      setSelectedMetricId(nextMetrics[0]?.id ?? '');
    }
  };

  return (
    <Page navId="code-health">
      <Page.Contents>
        <div className={styles.page}>
          <header className={styles.header}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" wrap="wrap" gap={2}>
              <Stack direction="column" gap={0.5}>
                <Text element="h2" variant="h3">
                  <Trans i18nKey="code-health.page.heading">Repository code health</Trans>
                </Text>
                <Text variant="body" color="secondary">
                  <Trans i18nKey="code-health.page.description">
                    Demo overview of lint, type, test, dependency, and CI signals. Numbers are mocked for demo purposes
                    and refresh as you change the time range.
                  </Trans>
                </Text>
              </Stack>
              <Field
                noMargin
                label={t('code-health.page.time-range-label', 'Time range')}
                description={t(
                  'code-health.page.time-range-description',
                  'Adjusts every metric, the trend chart, and the recommended actions.'
                )}
              >
                <RadioButtonGroup<TimeRange>
                  options={TIME_RANGE_OPTIONS}
                  value={range}
                  onChange={handleRangeChange}
                  data-testid="code-health-time-range"
                  aria-label={t('code-health.page.time-range-aria-label', 'Select time range')}
                />
              </Field>
            </Stack>
          </header>

          <section
            aria-label={t('code-health.page.metrics-aria-label', 'Code health metrics')}
            data-testid="code-health-metrics-grid"
            className={styles.grid}
          >
            {metrics.map((metric) => (
              <MetricCard
                key={metric.id}
                metric={metric}
                isSelected={metric.id === selectedMetric?.id}
                onSelect={setSelectedMetricId}
              />
            ))}
          </section>

          <section
            className={styles.split}
            aria-label={t('code-health.page.detail-aria-label', 'Selected metric details and recommended actions')}
          >
            <div className={styles.trendColumn}>
              {selectedMetric ? (
                <TrendChart metric={selectedMetric} />
              ) : (
                <Text color="secondary">
                  <Trans i18nKey="code-health.page.no-selected-metric">Select a metric to see its trend.</Trans>
                </Text>
              )}
            </div>

            <div className={styles.actionsColumn}>
              <Stack direction="column" gap={1}>
                <Text element="h3" variant="h4">
                  <Trans i18nKey="code-health.page.actions-heading">Recommended actions</Trans>
                </Text>
                <Text variant="bodySmall" color="secondary">
                  <Trans i18nKey="code-health.page.actions-description">
                    Suggested follow-up tickets that an engineer or agent could pick up next.
                  </Trans>
                </Text>
              </Stack>
              <RecommendedActions
                actions={actions}
                emptyMessage={t(
                  'code-health.page.actions-empty',
                  'No outstanding recommendations for this time range.'
                )}
              />
            </div>
          </section>
        </div>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  page: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    padding: theme.spacing(2, 0),
  }),
  header: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  grid: css({
    display: 'grid',
    gap: theme.spacing(2),
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  }),
  split: css({
    display: 'grid',
    gap: theme.spacing(2),
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
    [theme.breakpoints.down('lg')]: {
      gridTemplateColumns: '1fr',
    },
  }),
  trendColumn: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  actionsColumn: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
});

export default CodeHealthPage;
