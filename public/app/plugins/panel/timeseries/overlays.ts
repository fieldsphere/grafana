import { SimpleLinearRegression } from 'ml-regression-simple-linear';

import {
  type DataFrame,
  type Field,
  FieldType,
  getDisplayProcessor,
  getFieldDisplayName,
  type GrafanaTheme2,
} from '@grafana/data';
import { t } from '@grafana/i18n';
import { GraphDrawStyle, type GraphFieldConfig, StackingMode, VisibilityMode } from '@grafana/schema';

import { TimeSeriesOverlayMode, type TimeSeriesOverlayOptions } from './panelcfg.gen';

export const DEFAULT_OVERLAY_WINDOW_SIZE = 7;
export const OVERLAY_FIELD_MARKER = '__timeseriesOverlay';

const overlayLineStyle = { fill: 'dash' as const, dash: [10, 10] };

export function trailingMovingAverage(
  values: ReadonlyArray<number | null | undefined>,
  windowSize: number
): Array<number | null> {
  const window = Math.max(2, Math.floor(windowSize));
  const out: Array<number | null> = [];
  let sum = 0;
  let count = 0;

  for (let i = 0; i < values.length; i++) {
    const current = values[i];
    if (isFiniteNumber(current)) {
      sum += current;
      count += 1;
    }

    if (i >= window) {
      const leaving = values[i - window];
      if (isFiniteNumber(leaving)) {
        sum -= leaving;
        count -= 1;
      }
    }

    out.push(count === 0 ? null : sum / count);
  }

  return out;
}

export function linearRegressionValues(
  x: ReadonlyArray<number | null | undefined>,
  y: ReadonlyArray<number | null | undefined>
): Array<number | null> {
  const xs: number[] = [];
  const ys: number[] = [];
  let xMin = Infinity;

  const length = Math.min(x.length, y.length);
  for (let i = 0; i < length; i++) {
    const xv = x[i];
    const yv = y[i];
    if (!isFiniteNumber(xv) || !isFiniteNumber(yv)) {
      continue;
    }
    if (xv < xMin) {
      xMin = xv;
    }
    xs.push(xv);
    ys.push(yv);
  }

  if (xs.length < 2) {
    return Array.from({ length: y.length }, () => null);
  }

  const model = new SimpleLinearRegression(
    xs.map((value) => value - xMin),
    ys
  );

  return x.map((xv) => {
    if (!isFiniteNumber(xv)) {
      return null;
    }
    return model.predict(xv - xMin);
  });
}

export function applyTimeSeriesOverlays(
  frames: DataFrame[],
  overlay: TimeSeriesOverlayOptions | undefined,
  theme: GrafanaTheme2
): DataFrame[] {
  if (!overlay || overlay.mode === TimeSeriesOverlayMode.Off) {
    return frames;
  }

  return frames.map((frame) => applyOverlayToFrame(frame, overlay, theme));
}

function applyOverlayToFrame(frame: DataFrame, overlay: TimeSeriesOverlayOptions, theme: GrafanaTheme2): DataFrame {
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
      overlay.mode === TimeSeriesOverlayMode.MovingAverage
        ? trailingMovingAverage(field.values, overlay.windowSize ?? DEFAULT_OVERLAY_WINDOW_SIZE)
        : linearRegressionValues(timeField.values, field.values);

    if (values.every((value) => value == null)) {
      continue;
    }

    overlayFields.push(createOverlayField(field, frame, values, overlay.mode, theme));
  }

  if (overlayFields.length === 0) {
    return frame;
  }

  return {
    ...frame,
    fields: [...frame.fields, ...overlayFields],
  };
}

function shouldOverlayField(field: Field): boolean {
  if (field.type !== FieldType.number) {
    return false;
  }
  if (field.name.endsWith(OVERLAY_FIELD_MARKER)) {
    return false;
  }
  if (field.config.unit === 'bool') {
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
  values: Array<number | null>,
  mode: TimeSeriesOverlayMode,
  theme: GrafanaTheme2
): Field {
  const sourceName = getFieldDisplayName(source, frame);
  const displayName =
    mode === TimeSeriesOverlayMode.MovingAverage
      ? t('timeseries.overlay.moving-average-series', '{{name}} (moving average)', { name: sourceName })
      : t('timeseries.overlay.linear-regression-series', '{{name}} (linear regression)', { name: sourceName });

  const custom: GraphFieldConfig = {
    ...(source.config.custom ?? {}),
    drawStyle: GraphDrawStyle.Line,
    lineInterpolation: source.config.custom?.lineInterpolation,
    lineWidth: Math.max(source.config.custom?.lineWidth ?? 1, 2),
    lineStyle: overlayLineStyle,
    fillOpacity: 0,
    showPoints: VisibilityMode.Never,
    gradientMode: undefined,
    stacking: { mode: StackingMode.None, group: 'A' },
  };

  const overlayField: Field = {
    ...source,
    name: `${source.name}${OVERLAY_FIELD_MARKER}`,
    values,
    config: {
      ...source.config,
      displayName,
      custom,
    },
    state: {
      ...source.state,
      displayName,
    },
  };

  overlayField.display = getDisplayProcessor({ field: overlayField, theme });
  return overlayField;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
