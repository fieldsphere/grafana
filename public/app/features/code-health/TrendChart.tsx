import { css } from '@emotion/css';
import { useMemo } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Stack, Text, useStyles2 } from '@grafana/ui';

import { type CodeHealthMetric } from './types';

interface TrendChartProps {
  metric: CodeHealthMetric;
  height?: number;
}

const VIEW_HEIGHT = 120;
const VIEW_WIDTH = 320;
const PADDING_X = 12;
const PADDING_Y = 12;

export function TrendChart({ metric, height = 160 }: TrendChartProps) {
  const styles = useStyles2(getStyles);

  const series = metric.history;
  const xLabels = useMemo(() => buildXLabels(series.length), [series.length]);

  const { min, max } = useMemo(() => {
    const numericMin = Math.min(...series);
    const numericMax = Math.max(...series);
    if (numericMin === numericMax) {
      return { min: numericMin - 1, max: numericMax + 1 };
    }
    return { min: numericMin, max: numericMax };
  }, [series]);

  const points = useMemo(() => buildPoints(series, min, max), [series, min, max]);
  const path = useMemo(() => buildPath(points), [points]);
  const area = useMemo(() => buildArea(points), [points]);

  return (
    <div className={styles.container({ height })} data-testid="code-health-trend-chart">
      <Stack direction="row" alignItems="baseline" justifyContent="space-between">
        <Stack direction="column" gap={0}>
          <Text element="h3" variant="h5">
            {t('code-health.trend-chart.heading', '{{label}} trend', { label: metric.label })}
          </Text>
          <Text variant="bodySmall" color="secondary">
            {metric.description}
          </Text>
        </Stack>
        <Text variant="bodySmall" color="secondary">
          {t('code-health.trend-chart.range', 'Range: {{min}}–{{max}}', {
            min: `${min}${metric.unit ?? ''}`,
            max: `${max}${metric.unit ?? ''}`,
          })}
        </Text>
      </Stack>

      <svg
        className={styles.svg}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={t('code-health.trend-chart.aria-label', '{{label}} trend over the selected period', {
          label: metric.label,
        })}
      >
        <path d={area} className={styles.area} />
        <path d={path} className={styles.line} />
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r={2.5} className={styles.point} />
        ))}
      </svg>

      <Stack direction="row" justifyContent="space-between">
        {xLabels.map((label, index) => (
          <Text key={`${label}-${index}`} variant="bodySmall" color="secondary">
            {label}
          </Text>
        ))}
      </Stack>
    </div>
  );
}

interface Point {
  x: number;
  y: number;
}

function buildPoints(series: number[], min: number, max: number): Point[] {
  if (series.length === 0) {
    return [];
  }
  const innerWidth = VIEW_WIDTH - PADDING_X * 2;
  const innerHeight = VIEW_HEIGHT - PADDING_Y * 2;
  const span = max - min || 1;

  return series.map((value, index) => {
    const x = PADDING_X + (series.length === 1 ? innerWidth / 2 : (innerWidth * index) / (series.length - 1));
    const y = PADDING_Y + innerHeight - ((value - min) / span) * innerHeight;
    return { x, y };
  });
}

function buildPath(points: Point[]): string {
  if (points.length === 0) {
    return '';
  }
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(' ');
}

function buildArea(points: Point[]): string {
  if (points.length === 0) {
    return '';
  }
  const last = points[points.length - 1];
  const first = points[0];
  const baseline = VIEW_HEIGHT - PADDING_Y;
  return `${buildPath(points)} L${last.x.toFixed(2)},${baseline} L${first.x.toFixed(2)},${baseline} Z`;
}

function buildXLabels(length: number): string[] {
  const earliest = t('code-health.trend-chart.x-earliest', 'Earliest');
  const mid = t('code-health.trend-chart.x-mid', 'Mid');
  const now = t('code-health.trend-chart.x-now', 'Now');

  if (length <= 1) {
    return [now];
  }
  return Array.from({ length }, (_, i) => {
    if (i === 0) {
      return earliest;
    }
    if (i === length - 1) {
      return now;
    }
    if (i === Math.floor(length / 2)) {
      return mid;
    }
    return '·';
  });
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: ({ height }: { height: number }) =>
    css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1.5),
      padding: theme.spacing(2),
      background: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      minHeight: height,
    }),
  svg: css({
    width: '100%',
    height: 160,
    display: 'block',
  }),
  line: css({
    fill: 'none',
    stroke: theme.colors.primary.main,
    strokeWidth: 2,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
  }),
  area: css({
    fill: theme.colors.primary.transparent,
    stroke: 'none',
  }),
  point: css({
    fill: theme.colors.primary.main,
  }),
});
