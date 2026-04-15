import { toDataFrame } from '@grafana/data';

import {
  applyTechnicalIndicators,
  calculateEMA,
  calculateRSI,
  calculateSMA,
  getRangeStart,
  resolveTechnicalIndicatorOptions,
} from './indicators';

describe('candlestick indicators', () => {
  it('calculates SMA values after full window', () => {
    expect(calculateSMA([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it('calculates EMA values with smoothing', () => {
    const result = calculateEMA([1, 2, 3, 4, 5], 3);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBeCloseTo(2, 5);
    expect(result[3]).toBeCloseTo(3, 5);
    expect(result[4]).toBeCloseTo(4, 5);
  });

  it('calculates RSI values in range [0, 100]', () => {
    const result = calculateRSI([44, 45, 46, 45, 44, 45, 46, 47, 48], 3);
    expect(result.slice(0, 3)).toEqual([null, null, null]);
    expect(result[3]).toBeGreaterThanOrEqual(0);
    expect(result[3]).toBeLessThanOrEqual(100);
    expect(result[8]).toBeGreaterThanOrEqual(0);
    expect(result[8]).toBeLessThanOrEqual(100);
  });

  it('normalizes indicator options and clamps periods', () => {
    const resolved = resolveTechnicalIndicatorOptions({
      indicators: {
        showSMA: true,
        smaPeriod: 1,
        showEMA: true,
        emaPeriod: 9999,
        showRSI: true,
        rsiPeriod: NaN,
      },
    });

    expect(resolved).toEqual({
      showSMA: true,
      smaPeriod: 2,
      showEMA: true,
      emaPeriod: 500,
      showRSI: true,
      rsiPeriod: 14,
    });
  });

  it('adds SMA and EMA overlays and builds RSI panel frame', () => {
    const frame = toDataFrame({
      fields: [
        { name: 'time', values: [1, 2, 3, 4, 5] },
        { name: 'close', values: [10, 11, 12, 13, 14] },
      ],
    });

    const result = applyTechnicalIndicators(frame, 'close', {
      showSMA: true,
      smaPeriod: 3,
      showEMA: true,
      emaPeriod: 3,
      showRSI: true,
      rsiPeriod: 3,
    });

    expect(result.mainFrame.fields.map((field) => field.name)).toEqual(['time', 'close', 'SMA (3)', 'EMA (3)']);
    expect(result.rsiFrame?.fields.map((field) => field.name)).toEqual(['time', 'RSI (3)']);
  });

  it('returns correct quick range start for 1D and 5D presets', () => {
    const to = 1_700_000_000_000;

    const oneDayStart = getRangeStart(to, '1D');
    const fiveDayStart = getRangeStart(to, '5D');

    const oneDayMs = 24 * 60 * 60 * 1000;
    expect(to - oneDayStart).toBeCloseTo(oneDayMs, -2);
    expect(to - fiveDayStart).toBeCloseTo(oneDayMs * 5, -2);
  });
});
