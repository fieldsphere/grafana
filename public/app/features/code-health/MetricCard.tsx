import { css } from '@emotion/css';

import { type GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Icon, type IconName, Stack, Text, useStyles2 } from '@grafana/ui';

import { type CodeHealthMetric, type MetricStatus, type TrendDirection } from './types';

interface MetricCardProps {
  metric: CodeHealthMetric;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function MetricCard({ metric, isSelected, onSelect }: MetricCardProps) {
  const styles = useStyles2(getStyles);
  const interactive = Boolean(onSelect);

  const handleClick = () => {
    onSelect?.(metric.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(metric.id);
    }
  };

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? isSelected : undefined}
      aria-label={t('code-health.metric-card.aria-label', '{{label}}: {{value}}', {
        label: metric.label,
        value: formatValue(metric),
      })}
      data-testid={`code-health-metric-${metric.id}`}
      onClick={interactive ? handleClick : undefined}
      onKeyDown={handleKeyDown}
      className={styles.card({ status: metric.status, isSelected: Boolean(isSelected), interactive })}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Stack direction="row" alignItems="center" gap={1}>
          <span className={styles.iconBadge({ status: metric.status })} aria-hidden="true">
            <Icon name={metric.icon} size="lg" />
          </span>
          <Text variant="bodySmall" color="secondary">
            {metric.label}
          </Text>
        </Stack>
        <TrendBadge trend={metric.trend} delta={metric.trendDelta} unit={metric.unit} />
      </Stack>

      <div className={styles.value}>
        <Text element="p" variant="h2">
          {formatValue(metric)}
        </Text>
      </div>

      <Text variant="bodySmall" color="secondary">
        {metric.description}
      </Text>
    </div>
  );
}

function formatValue(metric: CodeHealthMetric): string {
  return `${metric.value}${metric.unit ?? ''}`;
}

interface TrendBadgeProps {
  trend: TrendDirection;
  delta: number;
  unit?: string;
}

function TrendBadge({ trend, delta, unit }: TrendBadgeProps) {
  const styles = useStyles2(getStyles);
  const iconName: IconName = trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'minus';
  const sign = delta > 0 ? '+' : '';
  const displayDelta = `${sign}${delta}${unit ?? ''}`;
  const label =
    trend === 'flat'
      ? t('code-health.metric-card.trend-flat', 'No change vs previous period')
      : t('code-health.metric-card.trend-delta', '{{delta}} vs previous period', { delta: displayDelta });
  const text = trend === 'flat' ? '0' : displayDelta;

  return (
    <span className={styles.trend({ trend })} aria-label={label} title={label}>
      <Icon name={iconName} size="sm" />
      <span>{text}</span>
    </span>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  const statusColor = (status: MetricStatus) => {
    switch (status) {
      case 'good':
        return theme.colors.success.main;
      case 'warning':
        return theme.colors.warning.main;
      case 'critical':
        return theme.colors.error.main;
      case 'info':
      default:
        return theme.colors.info.main;
    }
  };

  return {
    card: ({ status, isSelected, interactive }: { status: MetricStatus; isSelected: boolean; interactive: boolean }) =>
      css({
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.5),
        padding: theme.spacing(2),
        background: theme.colors.background.primary,
        border: `1px solid ${theme.colors.border.weak}`,
        borderLeft: `3px solid ${statusColor(status)}`,
        borderRadius: theme.shape.radius.default,
        cursor: interactive ? 'pointer' : 'default',
        outline: isSelected ? `2px solid ${theme.colors.primary.border}` : 'none',
        outlineOffset: -2,
        [theme.transitions.handleMotion('no-preference')]: {
          transition: theme.transitions.create(['box-shadow', 'transform'], {
            duration: theme.transitions.duration.shortest,
          }),
        },
        '&:hover': interactive
          ? {
              boxShadow: theme.shadows.z1,
              [theme.transitions.handleMotion('no-preference')]: {
                transform: 'translateY(-1px)',
              },
            }
          : {},
        '&:focus-visible': {
          outline: `2px solid ${theme.colors.primary.border}`,
          outlineOffset: -2,
        },
      }),
    iconBadge: ({ status }: { status: MetricStatus }) =>
      css({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: theme.spacing(4),
        height: theme.spacing(4),
        borderRadius: theme.shape.radius.default,
        background: theme.colors.action.hover,
        color: statusColor(status),
      }),
    value: css({
      lineHeight: 1.1,
    }),
    trend: ({ trend }: { trend: TrendDirection }) =>
      css({
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
        padding: theme.spacing(0.25, 1),
        borderRadius: theme.shape.radius.pill,
        fontSize: theme.typography.bodySmall.fontSize,
        fontWeight: theme.typography.fontWeightMedium,
        color:
          trend === 'up'
            ? theme.colors.success.text
            : trend === 'down'
              ? theme.colors.warning.text
              : theme.colors.text.secondary,
        background:
          trend === 'up'
            ? theme.colors.success.transparent
            : trend === 'down'
              ? theme.colors.warning.transparent
              : theme.colors.background.secondary,
      }),
  };
};
