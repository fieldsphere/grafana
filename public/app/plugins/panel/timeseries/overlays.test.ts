import { createDataFrame, createTheme, FieldType } from '@grafana/data';

import { applyTimeSeriesOverlays, linearRegressionValues, trailingMovingAverage } from './overlays';
import { TimeSeriesOverlayMode } from './panelcfg.gen';

describe('trailingMovingAverage', () => {
  it('computes a trailing mean of the last windowSize samples', () => {
    expect(trailingMovingAverage([1, 2, 3, 4, 5], 3)).toEqual([1, 1.5, 2, 3, 4]);
  });

  it('skips nulls inside the window and returns null when the window is empty', () => {
    expect(trailingMovingAverage([10, null, 30], 2)).toEqual([10, 10, 30]);
    expect(trailingMovingAverage([null, null, 4], 2)).toEqual([null, null, 4]);
  });

  it('treats window sizes below 2 as 2', () => {
    expect(trailingMovingAverage([2, 4, 6], 1)).toEqual([2, 3, 5]);
  });
});

describe('linearRegressionValues', () => {
  it('fits an exact line when y increases linearly with time', () => {
    expect(linearRegressionValues([1000, 2000, 3000], [10, 20, 30])).toEqual([10, 20, 30]);
  });

  it('returns a horizontal line when y is constant', () => {
    expect(linearRegressionValues([0, 1, 2, 3], [5, 5, 5, 5])).toEqual([5, 5, 5, 5]);
  });

  it('returns nulls when fewer than two finite points exist', () => {
    expect(linearRegressionValues([1, 2, 3], [null, 8, null])).toEqual([null, null, null]);
  });
});

describe('applyTimeSeriesOverlays', () => {
  const theme = createTheme();

  it('leaves frames unchanged when overlay mode is off', () => {
    const frame = createDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [1, 2, 3] },
        { name: 'value', type: FieldType.number, values: [1, 2, 3] },
      ],
    });

    const frames = [frame];
    const result = applyTimeSeriesOverlays(frames, { mode: TimeSeriesOverlayMode.Off }, theme);
    expect(result).toBe(frames);
    expect(result[0].fields).toHaveLength(2);
  });

  it('appends a dashed linear regression series per numeric field', () => {
    const frame = createDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [1000, 2000, 3000] },
        { name: 'value', type: FieldType.number, values: [10, 20, 30], config: { custom: {} } },
      ],
    });

    const [out] = applyTimeSeriesOverlays([frame], { mode: TimeSeriesOverlayMode.LinearRegression }, theme);
    expect(out.fields.map((field) => field.name)).toEqual(['time', 'value', 'value__timeseriesOverlay']);
    expect(out.fields[2].values).toEqual([10, 20, 30]);
    expect(out.fields[2].config.displayName).toBe('value (linear regression)');
    expect(out.fields[2].state?.displayName).toBe('value (linear regression)');
    expect(out.fields[2].config.custom?.lineStyle).toEqual({ fill: 'dash', dash: [10, 10] });
    expect(out.fields[2].config.custom?.fillOpacity).toBe(0);
  });

  it('appends a moving average series using the configured window size', () => {
    const frame = createDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [1, 2, 3, 4, 5] },
        { name: 'cpu', type: FieldType.number, values: [1, 2, 3, 4, 5], config: { custom: {} } },
      ],
    });

    const [out] = applyTimeSeriesOverlays([frame], { mode: TimeSeriesOverlayMode.MovingAverage, windowSize: 3 }, theme);

    expect(out.fields[2].values).toEqual([1, 1.5, 2, 3, 4]);
    expect(out.fields[2].config.displayName).toBe('cpu (moving average)');
  });

  it('does not overlay hidden or boolean series', () => {
    const frame = createDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [1, 2, 3] },
        {
          name: 'hidden',
          type: FieldType.number,
          values: [1, 2, 3],
          config: { custom: { hideFrom: { viz: true, legend: false, tooltip: false } } },
        },
        { name: 'flag', type: FieldType.number, values: [0, 1, 0], config: { unit: 'bool', custom: {} } },
      ],
    });

    const [out] = applyTimeSeriesOverlays([frame], { mode: TimeSeriesOverlayMode.LinearRegression }, theme);
    expect(out.fields).toHaveLength(3);
  });
});
