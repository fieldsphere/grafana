import { DataFrame, FieldType } from '@grafana/data';

import { AggregationType, COLOR_SCHEMES, ColorScheme } from './types';

export interface DayBucket {
  date: Date;
  dateKey: string;
  value: number;
}

function toDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function bucketByDay(series: DataFrame[], aggregation: AggregationType): Map<string, DayBucket> {
  const buckets = new Map<string, { values: number[]; date: Date }>();

  for (const frame of series) {
    const timeField = frame.fields.find((f) => f.type === FieldType.time);
    const valueFields = frame.fields.filter((f) => f.type === FieldType.number);

    if (!timeField || valueFields.length === 0) {
      continue;
    }

    for (let i = 0; i < timeField.values.length; i++) {
      const ts = timeField.values[i];
      const date = new Date(ts);
      const key = toDayKey(date);

      if (!buckets.has(key)) {
        const bucketDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        buckets.set(key, { values: [], date: bucketDate });
      }

      const bucket = buckets.get(key)!;
      for (const vf of valueFields) {
        const val = vf.values[i];
        if (typeof val === 'number' && !isNaN(val)) {
          bucket.values.push(val);
        }
      }
    }
  }

  const result = new Map<string, DayBucket>();
  for (const [key, bucket] of buckets) {
    result.set(key, {
      date: bucket.date,
      dateKey: key,
      value: aggregate(bucket.values, aggregation),
    });
  }
  return result;
}

export function aggregate(values: number[], aggregation: AggregationType): number {
  if (values.length === 0) {
    return 0;
  }

  switch (aggregation) {
    case AggregationType.Sum:
      return values.reduce((a, b) => a + b, 0);
    case AggregationType.Count:
      return values.length;
    case AggregationType.Mean:
      return values.reduce((a, b) => a + b, 0) / values.length;
    case AggregationType.Max:
      return Math.max(...values);
    case AggregationType.Min:
      return Math.min(...values);
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

export function getColorForValue(
  value: number,
  minValue: number,
  maxValue: number,
  colorScheme: ColorScheme
): string {
  const colors = COLOR_SCHEMES[colorScheme];
  if (value === 0 || maxValue === 0) {
    return colors[0];
  }

  const range = maxValue - minValue || 1;
  const normalized = (value - minValue) / range;
  const index = Math.min(Math.floor(normalized * (colors.length - 1)) + 1, colors.length - 1);
  return colors[index];
}

export function generateCalendarDays(endDate: Date, weeks: number): Date[][] {
  const calendar: Date[][] = [];
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  const lastSaturday = new Date(end);
  lastSaturday.setDate(end.getDate() + (6 - end.getDay()));

  const startDate = new Date(lastSaturday);
  startDate.setDate(lastSaturday.getDate() - (weeks * 7 - 1));

  const current = new Date(startDate);
  for (let w = 0; w < weeks; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    calendar.push(week);
  }
  return calendar;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getMonthLabel(month: number): string {
  return MONTH_LABELS[month];
}

export function getDayLabel(day: number): string {
  return DAY_LABELS[day];
}
