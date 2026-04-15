import { dateTime, type DataFrame, type Field, FieldType } from '@grafana/data';

export type QuickRangePreset = '1D' | '5D' | '7D' | '3M' | '6M' | '1Y';

export const quickRangePresets: Array<{ label: QuickRangePreset; amount: number; unit: 'day' | 'month' | 'year' }> = [
  { label: '1D', amount: 1, unit: 'day' },
  { label: '5D', amount: 5, unit: 'day' },
  { label: '7D', amount: 7, unit: 'day' },
  { label: '3M', amount: 3, unit: 'month' },
  { label: '6M', amount: 6, unit: 'month' },
  { label: '1Y', amount: 1, unit: 'year' },
];

export interface TechnicalIndicatorOptions {
  showSMA: boolean;
  smaPeriod: number;
  showEMA: boolean;
  emaPeriod: number;
  showRSI: boolean;
  rsiPeriod: number;
}

export interface TechnicalIndicatorResult {
  mainFrame: DataFrame;
  rsiFrame?: DataFrame;
}

export const defaultTechnicalIndicatorOptions: TechnicalIndicatorOptions = {
  showSMA: false,
  smaPeriod: 20,
  showEMA: false,
  emaPeriod: 20,
  showRSI: false,
  rsiPeriod: 14,
};

export function resolveTechnicalIndicatorOptions(rawOptions: unknown): TechnicalIndicatorOptions {
  const raw = (rawOptions as { indicators?: Partial<TechnicalIndicatorOptions> } | undefined)?.indicators ?? {};

  return {
    showSMA: Boolean(raw.showSMA),
    smaPeriod: clampPeriod(raw.smaPeriod, defaultTechnicalIndicatorOptions.smaPeriod),
    showEMA: Boolean(raw.showEMA),
    emaPeriod: clampPeriod(raw.emaPeriod, defaultTechnicalIndicatorOptions.emaPeriod),
    showRSI: Boolean(raw.showRSI),
    rsiPeriod: clampPeriod(raw.rsiPeriod, defaultTechnicalIndicatorOptions.rsiPeriod),
  };
}

export function getRangeStart(to: number, preset: QuickRangePreset): number {
  const range = quickRangePresets.find((candidate) => candidate.label === preset);
  if (!range) {
    return to;
  }

  return dateTime(to).subtract(range.amount, range.unit).valueOf();
}

export function applyTechnicalIndicators(
  frame: DataFrame,
  closeFieldName: string | undefined,
  options: TechnicalIndicatorOptions
): TechnicalIndicatorResult {
  const closeField = getCloseField(frame, closeFieldName);
  const timeField = frame.fields.find((field) => field.type === FieldType.time);

  if (!closeField || !timeField) {
    return { mainFrame: frame };
  }

  const closeValues = fieldValuesToNumbers(closeField.values);
  const extraFields: Field[] = [];
  let rsiFrame: DataFrame | undefined;

  if (options.showSMA) {
    extraFields.push(createIndicatorField(closeField, `SMA (${options.smaPeriod})`, calculateSMA(closeValues, options.smaPeriod)));
  }

  if (options.showEMA) {
    extraFields.push(createIndicatorField(closeField, `EMA (${options.emaPeriod})`, calculateEMA(closeValues, options.emaPeriod)));
  }

  if (options.showRSI) {
    const rsiField = createIndicatorField(closeField, `RSI (${options.rsiPeriod})`, calculateRSI(closeValues, options.rsiPeriod));
    rsiFrame = {
      ...frame,
      fields: [timeField, rsiField],
    };
  }

  if (extraFields.length === 0) {
    return { mainFrame: frame, rsiFrame };
  }

  return {
    mainFrame: {
      ...frame,
      fields: [...frame.fields, ...extraFields],
    },
    rsiFrame,
  };
}

export function calculateSMA(values: Array<number | null>, period: number): Array<number | null> {
  const result: Array<number | null> = Array(values.length).fill(null);
  let runningTotal = 0;
  let validValues = 0;

  for (let index = 0; index < values.length; index++) {
    const current = values[index];
    if (current != null) {
      runningTotal += current;
      validValues++;
    }

    const removeIndex = index - period;
    if (removeIndex >= 0) {
      const removed = values[removeIndex];
      if (removed != null) {
        runningTotal -= removed;
        validValues--;
      }
    }

    if (index >= period - 1 && validValues === period) {
      result[index] = runningTotal / period;
    }
  }

  return result;
}

export function calculateEMA(values: Array<number | null>, period: number): Array<number | null> {
  const result: Array<number | null> = Array(values.length).fill(null);
  const multiplier = 2 / (period + 1);

  const initialWindow = values.slice(0, period);
  if (initialWindow.some((value) => value == null)) {
    return result;
  }

  let previous = (initialWindow as number[]).reduce((sum, value) => sum + value, 0) / period;
  result[period - 1] = previous;

  for (let index = period; index < values.length; index++) {
    const current = values[index];
    if (current == null) {
      result[index] = null;
      continue;
    }

    previous = (current - previous) * multiplier + previous;
    result[index] = previous;
  }

  return result;
}

export function calculateRSI(values: Array<number | null>, period: number): Array<number | null> {
  const result: Array<number | null> = Array(values.length).fill(null);
  if (values.length <= period) {
    return result;
  }

  const deltas: Array<number | null> = [null];
  for (let index = 1; index < values.length; index++) {
    const current = values[index];
    const previous = values[index - 1];
    deltas.push(current == null || previous == null ? null : current - previous);
  }

  const initialWindow = deltas.slice(1, period + 1);
  if (initialWindow.some((delta) => delta == null)) {
    return result;
  }

  let averageGain = 0;
  let averageLoss = 0;
  for (const delta of initialWindow as number[]) {
    if (delta > 0) {
      averageGain += delta;
    } else {
      averageLoss += Math.abs(delta);
    }
  }
  averageGain /= period;
  averageLoss /= period;
  result[period] = getRsiValue(averageGain, averageLoss);

  for (let index = period + 1; index < values.length; index++) {
    const delta = deltas[index];
    if (delta == null) {
      result[index] = null;
      continue;
    }

    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? Math.abs(delta) : 0;
    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;
    result[index] = getRsiValue(averageGain, averageLoss);
  }

  return result;
}

function clampPeriod(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(500, Math.max(2, Math.round(value)));
}

function getCloseField(frame: DataFrame, configuredField: string | undefined): Field | undefined {
  if (configuredField) {
    const mapped = frame.fields.find((field) => field.name === configuredField);
    if (mapped?.type === FieldType.number) {
      return mapped;
    }
  }

  return frame.fields.find((field) => field.type === FieldType.number);
}

function createIndicatorField(source: Field, name: string, values: Array<number | null>): Field {
  return {
    ...source,
    name,
    values,
    state: undefined,
  };
}

function fieldValuesToNumbers(values: unknown): Array<number | null> {
  return Array.from(values as Array<number | null>).map((value) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return null;
    }

    return value;
  });
}

function getRsiValue(averageGain: number, averageLoss: number): number {
  if (averageLoss === 0) {
    return 100;
  }

  const relativeStrength = averageGain / averageLoss;
  return 100 - 100 / (1 + relativeStrength);
}
