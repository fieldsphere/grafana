import { createDataFrame, createTheme, dateTime, FieldType, type TimeRange } from '@grafana/data';

import {
  applySeriesOverlays,
  linearRegressionValues,
  MIN_OVERLAY_WINDOW_SIZE,
  trailingMovingAverage,
} from './overlays';
import { TimeSeriesOverlayType } from './panelcfg.gen';

const theme = createTheme();

function makeRange(fromMs: number, toMs: number): TimeRange {
  return {
    from: dateTime(fromMs),
    to: dateTime(toMs),
    raw: { from: dateTime(fromMs), to: dateTime(toMs) },
  };
}

describe('trailingMovingAverage', () => {
  it('uses a trailing window and emits partial averages until the window is full', () => {
    expect(trailingMovingAverage([1, 2, 3, 4, 5], 3)).toEqual([1, 1.5, 2, 3, 4]);
  });

  it('clamps window size to the minimum of 2', () => {
    expect(MIN_OVERLAY_WINDOW_SIZE).toBe(2);
    expect(trailingMovingAverage([10, 20, 30], 1)).toEqual([10, 15, 25]);
  });

  it('skips nulls in the average and emits null when the window has no finite values', () => {
    expect(trailingMovingAverage([1, null, 3, 4], 2)).toEqual([1, 1, 3, 3.5]);
    expect(trailingMovingAverage([null, null, 5], 2)).toEqual([null, null, 5]);
  });
});

describe('linearRegressionValues', () => {
  it('fits y = 2x over the full series', () => {
    const times = [0, 1, 2, 3, 4];
    expect(linearRegressionValues(times, [0, 2, 4, 6, 8])).toEqual([0, 2, 4, 6, 8]);
  });

  it('fits a horizontal line when y is constant', () => {
    expect(linearRegressionValues([0, 1, 2, 3], [5, 5, 5, 5])).toEqual([5, 5, 5, 5]);
  });

  it('fits only points inside the visible time range', () => {
    const times = [0, 10, 20, 30, 40];
    const values = [0, 100, 2, 3, 4];
    const fitted = linearRegressionValues(times, values, makeRange(20, 40));
    expect(fitted[0]).toBeCloseTo(0);
    expect(fitted[2]).toBe(2);
    expect(fitted[3]).toBe(3);
    expect(fitted[4]).toBe(4);
  });

  it('returns nulls when fewer than two visible points can be fitted', () => {
    expect(linearRegressionValues([0, 1, 2], [1, null, null])).toEqual([null, null, null]);
    expect(linearRegressionValues([0, 1, 2], [1, 2, 3], makeRange(2, 2))).toEqual([null, null, null]);
  });
});

describe('applySeriesOverlays', () => {
  const frame = createDataFrame({
    fields: [
      { name: 'time', type: FieldType.time, values: [1000, 2000, 3000] },
      { name: 'cpu', type: FieldType.number, values: [10, 20, 30], config: { custom: {} } },
    ],
  });

  it('leaves frames unchanged when the overlay is disabled or missing', () => {
    const frames = [frame];
    expect(applySeriesOverlays(frames, undefined, undefined, theme)).toBe(frames);
    expect(applySeriesOverlays(frames, { enabled: false }, undefined, theme)).toBe(frames);
  });

  it('appends a dashed moving-average series per numeric field', () => {
    const [result] = applySeriesOverlays(
      [frame],
      { enabled: true, type: TimeSeriesOverlayType.MovingAverage, windowSize: 2 },
      undefined,
      theme
    );

    expect(result.fields).toHaveLength(3);
    const overlay = result.fields[2];
    expect(overlay.config.displayName).toBe('cpu (Moving average)');
    expect(overlay.values).toEqual([10, 15, 25]);
    expect(overlay.config.custom?.lineStyle).toEqual({ fill: 'dash', dash: [10, 10] });
    expect(overlay.config.custom?.drawStyle).toBe('line');
    expect(overlay.config.custom?.hideFrom).toEqual({ viz: false, legend: false, tooltip: false });
    expect(overlay.state?.seriesIndex).not.toBe(result.fields[1].state?.seriesIndex);
  });

  it('appends a linear-regression series fitted to the visible domain', () => {
    const [result] = applySeriesOverlays(
      [frame],
      { enabled: true, type: TimeSeriesOverlayType.LinearRegression },
      makeRange(1000, 3000),
      theme
    );

    const overlay = result.fields[2];
    expect(overlay.config.displayName).toBe('cpu (Linear regression)');
    expect(overlay.values).toEqual([10, 20, 30]);
    expect(overlay.config.custom?.spanNulls).toBe(true);
  });

  it('does not overlay boolean or already-derived overlay fields', () => {
    const mixed = createDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [1, 2] },
        { name: 'ok', type: FieldType.number, values: [1, 0], config: { unit: 'bool', custom: {} } },
        {
          name: 'cpu (Moving average)',
          type: FieldType.number,
          values: [1, 2],
          config: { custom: { timeseriesOverlay: TimeSeriesOverlayType.MovingAverage } },
        },
      ],
    });

    const [result] = applySeriesOverlays([mixed], { enabled: true }, undefined, theme);
    expect(result.fields).toHaveLength(3);
  });
});
