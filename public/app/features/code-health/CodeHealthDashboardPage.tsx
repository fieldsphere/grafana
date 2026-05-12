import { css } from '@emotion/css';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import {
  Alert,
  Badge,
  Button,
  Field,
  RadioButtonGroup,
  Spinner,
  Stack,
  Text,
  useStyles2,
  useTheme2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import {
  type CodeHealthSummaryCard,
  type CodeHealthTimeframe,
  type CodeHealthTrendPoint,
  type CodeHealthViewModel,
  fetchCodeHealthSummary,
} from './codeHealthDashboardData';

const TIMEFRAME_OPTIONS: Array<{ label: string; value: CodeHealthTimeframe }> = [
  { label: t('code-health.dashboard.timeframe.7d', '7 days'), value: '7d' },
  { label: t('code-health.dashboard.timeframe.30d', '30 days'), value: '30d' },
  { label: t('code-health.dashboard.timeframe.90d', '90 days'), value: '90d' },
];

export default function CodeHealthDashboardPage() {
  const styles = useStyles2(getStyles);
  const [timeframe, setTimeframe] = useState<CodeHealthTimeframe>('30d');
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [model, setModel] = useState<CodeHealthViewModel | undefined>();

  const load = useCallback(async () => {
    setPhase('loading');
    try {
      const data = await fetchCodeHealthSummary(timeframe);
      setModel(data);
      setPhase('ready');
    } catch {
      setModel(undefined);
      setPhase('error');
    }
  }, [timeframe]);

  useEffect(() => {
    load();
  }, [load]);

  const maxSeverity = useMemo(() => Math.max(...(model?.severityRows.map((r) => r.count) ?? [1])), [model]);

  return (
    <Page
      navId="code-health"
      pageNav={{ text: '', active: true }}
      subTitle={t(
        'code-health.dashboard.subtitle',
        'Mock signals for demos of agents triaging lint, tests, coverage, dependencies, and CI—values are illustrative only.'
      )}
    >
      <Page.Contents>
        <Stack direction="column" gap={3}>
          <Stack justifyContent="space-between" alignItems="flex-end" wrap="wrap">
            <div className={styles.filterIntro}>
              <Text element="h2" variant="body">
                {t('code-health.dashboard.filters.heading', 'Reporting window')}
              </Text>
              <Text variant="bodySmall" color="secondary">
                {t(
                  'code-health.dashboard.filters.caption',
                  'Agents can correlate longer windows when investigating regressions.'
                )}
              </Text>
            </div>
            <Field label={t('code-health.dashboard.timeframe.label', 'Window')}>
              <RadioButtonGroup<CodeHealthTimeframe>
                options={TIMEFRAME_OPTIONS}
                value={timeframe}
                onChange={setTimeframe}
              />
            </Field>
          </Stack>

          {phase === 'loading' && (
            <Stack direction="column" gap={2} alignItems="center" justifyContent="center">
              <Spinner />
              <Text role="status" variant="body" color="secondary">
                {t('code-health.dashboard.loading', 'Refreshing demo workspace metrics')}
              </Text>
            </Stack>
          )}

          {phase === 'error' && (
            <Alert
              severity="error"
              title={t('code-health.dashboard.error.title', 'Could not refresh metrics')}
              buttonContent={t('code-health.dashboard.error.retry', 'Retry')}
              onRemove={load}
            >
              {t(
                'code-health.dashboard.error.body',
                'The demo datasource failed. Retry simulates requesting the workspace again.'
              )}
            </Alert>
          )}

          {phase === 'ready' && model && (
            <>
              <section aria-label={t('code-health.dashboard.metrics.region', 'Repository summary metrics')}>
                <div className={styles.metricGrid}>
                  {model.cards.map((card) => (
                    <MetricCard key={card.id} card={card} styles={styles} />
                  ))}
                </div>
              </section>

              <section className={styles.split} aria-labelledby="code-health-breakdown-heading">
                <Stack direction="column" gap={2} flex={1}>
                  <Text variant="h3" id="code-health-breakdown-heading">
                    {t('code-health.dashboard.severity.title', 'Lint backlog by tier')}
                  </Text>
                  <Text variant="bodySmall" color="secondary">
                    {t(
                      'code-health.dashboard.severity.helper',
                      'Synthetic distribution for prioritizing agent-driven cleanups.'
                    )}
                  </Text>
                  <Stack direction="column" gap={2}>
                    {model.severityRows.map((row) => (
                      <div key={row.id}>
                        <Stack justifyContent="space-between">
                          <Text variant="body">{row.label}</Text>
                          <Badge text={String(row.count)} color="blue" />
                        </Stack>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barFill}
                            style={{ width: `${Math.min(100, (row.count / maxSeverity) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </Stack>
                </Stack>

                <Stack direction="column" gap={2} flex={1}>
                  <Text variant="h3">{t('code-health.dashboard.trend.title', 'Quality trend snapshot')}</Text>
                  <Text variant="bodySmall" color="secondary">
                    {t(
                      'code-health.dashboard.trend.helper',
                      'Compare lint backlog against coverage lifts without wiring to real CI payloads.'
                    )}
                  </Text>
                  <TrendChart points={model.lintTrend} />
                  <Stack direction="row" gap={3}>
                    <Badge color="blue" icon="chart-line" text={t('code-health.dashboard.trend.legendLint', 'Lint')} />
                    <Badge
                      color="green"
                      icon="bolt"
                      text={t('code-health.dashboard.trend.legendCoverage', 'Coverage')}
                    />
                  </Stack>
                </Stack>
              </section>

              <section aria-labelledby="code-health-actions-heading">
                <Stack direction="column" gap={2}>
                  <Text variant="h3" id="code-health-actions-heading">
                    {t('code-health.dashboard.actions.title', 'Prioritized recommendations')}
                  </Text>
                  <ol className={styles.actionList}>
                    {model.recommendations.map((rec) => (
                      <li key={rec.id}>
                        <div className={styles.actionCard}>
                          <Stack direction="column" gap={1}>
                            <Text variant="body">{rec.title}</Text>
                            <Text variant="bodySmall" color="secondary">
                              {rec.rationale}
                            </Text>
                          </Stack>
                          <Badge
                            icon="document-info"
                            text={`#${rec.rank} · ${rec.suggestedTicket}`}
                            color="purple"
                          />
                        </div>
                      </li>
                    ))}
                  </ol>
                  <Stack>
                    <Button variant="secondary" size="sm" disabled>
                      {t('code-health.dashboard.actions.export', 'Export mock findings (stub)')}
                    </Button>
                  </Stack>
                </Stack>
              </section>
            </>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

function MetricCard({ card, styles }: { card: CodeHealthSummaryCard; styles: ReturnType<typeof getStyles> }) {
  return (
    <div className={styles.metricCard} data-testid={`code-health-card-${card.id}`}>
      <Text variant="h5">{card.label}</Text>
      <Text variant="h3">
        {card.value}
        {card.valueSuffix ?? ''}
      </Text>
      <SparkBars values={card.spark} />
      <Text variant="bodySmall" color="secondary">
        {card.helper}
      </Text>
    </div>
  );
}

function SparkBars({ values }: { values: number[] }) {
  const theme = useTheme2();
  const rowStyle = css({
    display: 'flex',
    gap: theme.spacing(0.75),
    height: theme.spacing(4),
    alignItems: 'flex-end',
    marginBottom: theme.spacing(1),
  });
  const barBase = css({
    flex: '1',
    borderRadius: theme.shape.radius.default,
    minWidth: theme.spacing(0.75),
  });

  return (
    <div className={rowStyle} aria-hidden>
      {values.map((fraction, idx) => {
        const clamped = Math.max(0.08, Math.min(fraction, 1));
        return (
          <div
            // eslint-disable-next-line react/no-array-index-key -- static demo lengths
            key={idx}
            className={barBase}
            style={{
              flexGrow: clamped,
              opacity: 0.4 + clamped / 2,
              backgroundImage: `linear-gradient(180deg, ${theme.colors.primary.main}, transparent)`,
            }}
          />
        );
      })}
    </div>
  );
}

function TrendChart({ points }: { points: CodeHealthTrendPoint[] }) {
  const styles = useStyles2(getTrendStyles);
  const maxLint = Math.max(...points.map((p) => p.lintIssues), 1);
  const maxCov = Math.max(...points.map((p) => p.coveragePct), 1);

  return (
    <div
      className={styles.chart}
      aria-label={t('code-health.dashboard.trend.aria', 'Weekly lint versus coverage')}
      role="group"
    >
      {points.map((point) => (
        <div key={point.week} className={styles.column}>
          <div className={styles.bars}>
            <div
              className={styles.lintSeries}
              style={{ height: `${(point.lintIssues / maxLint) * 100}%` }}
              aria-label={t('code-health.dashboard.trend.lintValue', '{{count}} issues', { count: point.lintIssues })}
            />
            <div
              className={styles.coverageSeries}
              style={{ height: `${(point.coveragePct / maxCov) * 100}%` }}
              aria-label={t('code-health.dashboard.trend.coverageValue', '{{pct}}% coverage', {
                pct: point.coveragePct,
              })}
            />
          </div>
          <Text variant="caption" color="secondary">
            {point.week}
          </Text>
        </div>
      ))}
    </div>
  );
}

const getTrendStyles = (theme: GrafanaTheme2) => ({
  chart: css({
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: theme.spacing(2, 0),
    flexWrap: 'wrap',
  }),
  column: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    flex: '1 1 96px',
  }),
  bars: css({
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'flex-end',
    height: theme.spacing(18),
  }),
  lintSeries: css({
    width: theme.spacing(2.5),
    borderRadius: theme.shape.radius.default,
    backgroundColor: theme.colors.primary.main,
    minHeight: theme.spacing(0.5),
  }),
  coverageSeries: css({
    width: theme.spacing(2.5),
    borderRadius: theme.shape.radius.default,
    backgroundColor: theme.colors.success.main,
    minHeight: theme.spacing(0.5),
  }),
});

const getStyles = (theme: GrafanaTheme2) => ({
  filterIntro: css({
    maxWidth: '480px',
  }),
  metricGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: theme.spacing(2),
  }),
  metricCard: css({
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    background: theme.colors.background.secondary,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  split: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(3),
  }),
  barTrack: css({
    height: theme.spacing(0.75),
    borderRadius: theme.shape.radius.default,
    backgroundColor: theme.colors.border.weak,
    marginTop: theme.spacing(1),
    overflow: 'hidden',
  }),
  barFill: css({
    height: '100%',
    borderRadius: theme.shape.radius.default,
    background: `linear-gradient(90deg, ${theme.colors.primary.main}, ${theme.colors.success.main})`,
  }),
  actionList: css({
    margin: 0,
    paddingLeft: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    listStyle: 'decimal',
  }),
  actionCard: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    backgroundColor: theme.colors.background.primary,
    boxShadow: theme.shadows.z1,
  }),
});
