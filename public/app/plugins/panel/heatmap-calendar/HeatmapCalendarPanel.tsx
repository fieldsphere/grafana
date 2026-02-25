import { css } from '@emotion/css';
import { useMemo, useCallback, useState } from 'react';

import { GrafanaTheme2, PanelProps } from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';

import { Options } from './types';
import { bucketByDay, generateCalendarDays, getColorForValue, getDayLabel, getMonthLabel } from './utils';

const CELL_SIZE = 13;
const CELL_GAP = 3;
const CELL_ROUND = 2;
const LABEL_WIDTH = 30;
const HEADER_HEIGHT = 20;

interface TooltipState {
  x: number;
  y: number;
  date: Date;
  value: number;
}

export function HeatmapCalendarPanel({ data, width, height, options }: PanelProps<Options>) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const cellStep = CELL_SIZE + CELL_GAP;
  const leftPad = options.showLabels ? LABEL_WIDTH : 0;
  const topPad = options.showLabels ? HEADER_HEIGHT : 0;
  const availableWidth = width - leftPad;
  const maxWeeks = Math.max(1, Math.floor(availableWidth / cellStep));

  const buckets = useMemo(
    () => bucketByDay(data.series, options.aggregation),
    [data.series, options.aggregation]
  );

  const calendar = useMemo(() => generateCalendarDays(new Date(), maxWeeks), [maxWeeks]);

  const { minValue, maxValue } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const b of buckets.values()) {
      if (b.value > 0) {
        min = Math.min(min, b.value);
        max = Math.max(max, b.value);
      }
    }
    if (min === Infinity) {
      min = 0;
    }
    if (max === -Infinity) {
      max = 0;
    }
    return { minValue: min, maxValue: max };
  }, [buckets]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<SVGRectElement>, date: Date, value: number) => {
      if (!options.showTooltip) {
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({ x: rect.left + rect.width / 2, y: rect.top, date, value });
    },
    [options.showTooltip]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const svgWidth = leftPad + calendar.length * cellStep;
  const svgHeight = topPad + 7 * cellStep;
  const todayKey = formatDateKey(new Date());

  return (
    <div className={styles.container} data-testid="heatmap-calendar-panel">
      <svg
        width={Math.min(svgWidth, width)}
        height={Math.min(svgHeight, height)}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className={styles.svg}
      >
        {options.showLabels && (
          <>
            {[1, 3, 5].map((dayIdx) => (
              <text
                key={`day-${dayIdx}`}
                x={leftPad - 4}
                y={topPad + dayIdx * cellStep + CELL_SIZE / 2}
                textAnchor="end"
                dominantBaseline="central"
                className={styles.label}
                fill={theme.colors.text.secondary}
                fontSize={10}
              >
                {getDayLabel(dayIdx)}
              </text>
            ))}
            {renderMonthLabels(calendar, leftPad, cellStep, styles, theme)}
          </>
        )}

        {calendar.map((week, weekIdx) =>
          week.map((date, dayIdx) => {
            const key = formatDateKey(date);
            const bucket = buckets.get(key);
            const value = bucket?.value ?? 0;
            const fill = getColorForValue(value, minValue, maxValue, options.colorScheme);
            const isToday = key === todayKey;

            return (
              <rect
                key={key}
                data-testid="heatmap-calendar-cell"
                x={leftPad + weekIdx * cellStep}
                y={topPad + dayIdx * cellStep}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={CELL_ROUND}
                ry={CELL_ROUND}
                fill={fill}
                stroke={isToday ? theme.colors.text.primary : 'none'}
                strokeWidth={isToday ? 1.5 : 0}
                onMouseEnter={(e) => handleMouseEnter(e, date, value)}
                onMouseLeave={handleMouseLeave}
                className={styles.cell}
              />
            );
          })
        )}
      </svg>

      {tooltip && (
        <div
          className={styles.tooltip}
          style={{
            left: tooltip.x,
            top: tooltip.y - 36,
          }}
          data-testid="heatmap-calendar-tooltip"
        >
          <strong>{tooltip.value}</strong> on {formatDisplayDate(tooltip.date)}
        </div>
      )}
    </div>
  );
}

function renderMonthLabels(
  calendar: Date[][],
  leftPad: number,
  cellStep: number,
  styles: ReturnType<typeof getStyles>,
  theme: GrafanaTheme2
) {
  const labels: React.ReactNode[] = [];
  let lastMonth = -1;

  for (let w = 0; w < calendar.length; w++) {
    const firstDayOfWeek = calendar[w][0];
    const month = firstDayOfWeek.getMonth();
    if (month !== lastMonth) {
      lastMonth = month;
      labels.push(
        <text
          key={`month-${w}`}
          x={leftPad + w * cellStep}
          y={12}
          className={styles.label}
          fill={theme.colors.text.secondary}
          fontSize={10}
        >
          {getMonthLabel(month)}
        </text>
      );
    }
  }
  return labels;
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  svg: css({
    display: 'block',
  }),
  cell: css({
    cursor: 'pointer',
    '&:hover': {
      strokeWidth: 1.5,
      stroke: theme.colors.text.primary,
    },
  }),
  label: css({
    fontFamily: theme.typography.fontFamilyMonospace,
    userSelect: 'none',
  }),
  tooltip: css({
    position: 'fixed',
    transform: 'translateX(-50%)',
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.primary,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: theme.zIndex.tooltip,
    boxShadow: theme.shadows.z2,
  }),
});
