import {
  type DataFrame,
  type Field,
  FieldColorModeId,
  FieldType,
  getDisplayProcessor,
  getFieldDisplayName,
  getFieldSeriesColor,
  type GrafanaTheme2,
  type TimeRange,
} from '@grafana/data';
import { t } from '@grafana/i18n';
import {
  GraphDrawStyle,
  GraphGradientMode,
  type GraphFieldConfig,
  LineInterpolation,
  StackingMode,
  VisibilityMode,
} from '@grafana/schema';

import {
  defaultTimeSeriesOverlayOptions,
  type TimeSeriesOverlayOptions,
  TimeSeriesOverlayType,
} from './panelcfg.gen';

export const MIN_OVERLAY_WINDOW_SIZE = 2;

type OverlayGraphFieldConfig = GraphFieldConfig & {
  timeseriesOverlay?: TimeSeriesOverlayType;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function overlayType(overlay: TimeSeriesOverlayOptions): TimeSeriesOverlayType {
  return overlay.type ?? defaultTimeSeriesOverlayOptions.type ?? TimeSeriesOverlayType.MovingAverage;
}

function overlayWindowSize(overlay: TimeSeriesOverlayOptions): number {
  const raw = overlay.windowSize ?? defaultTimeSeriesOverlayOptions.windowSize ?? 10;
  return Math.max(MIN_OVERLAY_WINDOW_SIZE, Math.floor(raw));
}

function nextSeriesIndex(frames: DataFrame[]): number {
  let max = -1;
  for (const frame of frames) {
    for (const field of frame.fields) {
      const idx = field.state?.seriesIndex;
      if (idx != null && idx > max) {
        max = idx;
      }
    }
  }
  return max + 1;
}

export function trailingMovingAverage(values: unknown[], windowSize: number): Array<number | null> {
  const window = Math.max(MIN_OVERLAY_WINDOW_SIZE, Math.floor(windowSize));
  const out: Array<number | null> = new Array(values.length);
  let sum = 0;
  let count = 0;

  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (isFiniteNumber(value)) {
      sum += value;
      count += 1;
    }

    if (i >= window) {
      const leaving = values[i - window];
      if (isFiniteNumber(leaving)) {
        sum -= leaving;
        count -= 1;
      }
    }

    out[i] = count === 0 ? null : sum / count;
  }

  return out;
}

export function linearRegressionValues(
  times: unknown[],
  values: unknown[],
  timeRange?: TimeRange
): Array<number | null> {
  const from = timeRange?.from.valueOf();
  const to = timeRange?.to.valueOf();
  const xs: number[] = [];
  const ys: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const y = values[i];
    const x = times[i];
    if (!isFiniteNumber(y) || !isFiniteNumber(x)) {
      continue;
    }
    if (from != null && x < from) {
      continue;
    }
    if (to != null && x > to) {
      continue;
    }
    xs.push(x);
    ys.push(y);
  }

  if (xs.length < 2) {
    return values.map(() => null);
  }

  const xMin = xs[0];
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < xs.length; i++) {
    const x = xs[i] - xMin;
    const y = ys[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const n = xs.length;
  const denom = n * sumX2 - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  return times.map((time) => {
    if (!isFiniteNumber(time)) {
      return null;
    }
    return intercept + slope * (time - xMin);
  });
}

function overlayDisplayName(sourceName: string, type: TimeSeriesOverlayType): string {
  if (type === TimeSeriesOverlayType.LinearRegression) {
    return t('timeseries.overlay.legend-linear-regression', '{{name}} (Linear regression)', { name: sourceName });
  }
  return t('timeseries.overlay.legend-moving-average', '{{name}} (Moving average)', { name: sourceName });
}

function shouldOverlayField(field: Field): boolean {
  if (field.type !== FieldType.number) {
    return false;
  }
  if (field.config.unit === 'bool') {
    return false;
  }
  if ((field.config.custom as OverlayGraphFieldConfig | undefined)?.timeseriesOverlay) {
    return false;
  }
  if (field.config.custom?.hideFrom?.viz) {
    return false;
  }
  return true;
}

function createOverlayField(
  source: Field,
  frame: DataFrame,
  frames: DataFrame[],
  values: Array<number | null>,
  type: TimeSeriesOverlayType,
  theme: GrafanaTheme2,
  seriesIndex: number
): Field {
  const sourceName = getFieldDisplayName(source, frame, frames);
  const displayName = overlayDisplayName(sourceName, type);
  const sourceColor = getFieldSeriesColor(source, theme).color;
  const sourceCustom = (source.config.custom ?? {}) as GraphFieldConfig;

  const custom: OverlayGraphFieldConfig = {
    drawStyle: GraphDrawStyle.Line,
    lineInterpolation: LineInterpolation.Linear,
    lineWidth: sourceCustom.lineWidth ?? 1,
    lineStyle: { fill: 'dash', dash: [10, 10] },
    fillOpacity: 0,
    gradientMode: GraphGradientMode.None,
    showPoints: VisibilityMode.Never,
    showValues: false,
    spanNulls: type === TimeSeriesOverlayType.LinearRegression,
    stacking: { mode: StackingMode.None, group: 'overlay' },
    hideFrom: { viz: false, legend: false, tooltip: false },
    axisPlacement: sourceCustom.axisPlacement,
    axisSoftMin: sourceCustom.axisSoftMin,
    axisSoftMax: sourceCustom.axisSoftMax,
    axisCenteredZero: sourceCustom.axisCenteredZero,
    scaleDistribution: sourceCustom.scaleDistribution,
    timeseriesOverlay: type,
  };

  const field: Field = {
    name: displayName,
    type: FieldType.number,
    values,
    config: {
      displayName,
      unit: source.config.unit,
      decimals: source.config.decimals,
      min: source.config.min,
      max: source.config.max,
      color: { mode: FieldColorModeId.Fixed, fixedColor: sourceColor },
      custom,
    },
    state: {
      displayName,
      seriesIndex,
    },
  };

  field.display = getDisplayProcessor({ field, theme });
  return field;
}

/**
 * Appends a derived overlay field after each numeric series when the overlay is enabled.
 * Overlay fields are display-only: they inherit the source color and use a dashed line.
 */
export function applySeriesOverlays(
  frames: DataFrame[],
  overlay: TimeSeriesOverlayOptions | undefined,
  timeRange: TimeRange | undefined,
  theme: GrafanaTheme2
): DataFrame[] {
  if (!overlay?.enabled) {
    return frames;
  }

  const type = overlayType(overlay);
  const windowSize = overlayWindowSize(overlay);
  let seriesIndex = nextSeriesIndex(frames);

  return frames.map((frame) => {
    const timeField = frame.fields.find((field) => field.type === FieldType.time);
    if (!timeField) {
      return frame;
    }

    const overlayFields: Field[] = [];
    for (const field of frame.fields) {
      if (!shouldOverlayField(field)) {
        continue;
      }

      const values =
        type === TimeSeriesOverlayType.LinearRegression
          ? linearRegressionValues(timeField.values, field.values, timeRange)
          : trailingMovingAverage(field.values, windowSize);

      overlayFields.push(createOverlayField(field, frame, frames, values, type, theme, seriesIndex++));
    }

    if (overlayFields.length === 0) {
      return frame;
    }

    return {
      ...frame,
      fields: [...frame.fields, ...overlayFields],
    };
  });
}
