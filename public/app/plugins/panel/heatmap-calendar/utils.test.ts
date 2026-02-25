import { FieldType, toDataFrame } from '@grafana/data';

import { AggregationType, ColorScheme } from './types';
import { aggregate, bucketByDay, generateCalendarDays, getColorForValue, getDayLabel, getMonthLabel } from './utils';

describe('aggregate', () => {
  it('returns 0 for empty array', () => {
    expect(aggregate([], AggregationType.Sum)).toBe(0);
  });

  it('calculates sum', () => {
    expect(aggregate([1, 2, 3], AggregationType.Sum)).toBe(6);
  });

  it('calculates count', () => {
    expect(aggregate([1, 2, 3], AggregationType.Count)).toBe(3);
  });

  it('calculates mean', () => {
    expect(aggregate([2, 4, 6], AggregationType.Mean)).toBe(4);
  });

  it('calculates max', () => {
    expect(aggregate([1, 5, 3], AggregationType.Max)).toBe(5);
  });

  it('calculates min', () => {
    expect(aggregate([1, 5, 3], AggregationType.Min)).toBe(1);
  });
});

describe('bucketByDay', () => {
  it('buckets time series data by day', () => {
    const frame = toDataFrame({
      fields: [
        {
          name: 'time',
          type: FieldType.time,
          values: [
            new Date('2025-01-15T10:00:00').getTime(),
            new Date('2025-01-15T14:00:00').getTime(),
            new Date('2025-01-16T10:00:00').getTime(),
          ],
        },
        {
          name: 'value',
          type: FieldType.number,
          values: [3, 7, 5],
        },
      ],
    });

    const result = bucketByDay([frame], AggregationType.Sum);
    expect(result.get('2025-01-15')?.value).toBe(10);
    expect(result.get('2025-01-16')?.value).toBe(5);
  });

  it('returns empty map for frames with no time field', () => {
    const frame = toDataFrame({
      fields: [{ name: 'value', type: FieldType.number, values: [1, 2] }],
    });

    const result = bucketByDay([frame], AggregationType.Sum);
    expect(result.size).toBe(0);
  });

  it('uses count aggregation', () => {
    const frame = toDataFrame({
      fields: [
        {
          name: 'time',
          type: FieldType.time,
          values: [
            new Date('2025-03-01T01:00:00').getTime(),
            new Date('2025-03-01T02:00:00').getTime(),
            new Date('2025-03-01T03:00:00').getTime(),
          ],
        },
        {
          name: 'value',
          type: FieldType.number,
          values: [10, 20, 30],
        },
      ],
    });

    const result = bucketByDay([frame], AggregationType.Count);
    expect(result.get('2025-03-01')?.value).toBe(3);
  });
});

describe('getColorForValue', () => {
  it('returns first color for value 0', () => {
    expect(getColorForValue(0, 0, 10, ColorScheme.Green)).toBe('#ebedf0');
  });

  it('returns last color for max value', () => {
    expect(getColorForValue(10, 1, 10, ColorScheme.Green)).toBe('#216e39');
  });

  it('returns first color when maxValue is 0', () => {
    expect(getColorForValue(0, 0, 0, ColorScheme.Blue)).toBe('#ebedf0');
  });

  it('returns intermediate color for middle values', () => {
    const color = getColorForValue(5, 1, 10, ColorScheme.Green);
    expect(color).toBeDefined();
    expect(color).not.toBe('#ebedf0');
  });
});

describe('generateCalendarDays', () => {
  it('generates correct number of weeks', () => {
    const calendar = generateCalendarDays(new Date('2025-06-15'), 10);
    expect(calendar.length).toBe(10);
  });

  it('each week has 7 days', () => {
    const calendar = generateCalendarDays(new Date('2025-06-15'), 5);
    for (const week of calendar) {
      expect(week.length).toBe(7);
    }
  });

  it('weeks start on Sunday', () => {
    const calendar = generateCalendarDays(new Date('2025-06-15'), 5);
    for (const week of calendar) {
      expect(week[0].getDay()).toBe(0);
    }
  });
});

describe('getMonthLabel', () => {
  it('returns correct month abbreviation', () => {
    expect(getMonthLabel(0)).toBe('Jan');
    expect(getMonthLabel(11)).toBe('Dec');
  });
});

describe('getDayLabel', () => {
  it('returns correct day abbreviation', () => {
    expect(getDayLabel(0)).toBe('Sun');
    expect(getDayLabel(1)).toBe('Mon');
    expect(getDayLabel(6)).toBe('Sat');
  });
});
