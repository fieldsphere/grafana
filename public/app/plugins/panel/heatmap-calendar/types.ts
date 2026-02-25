export enum ColorScheme {
  Green = 'green',
  Blue = 'blue',
  Red = 'red',
  Purple = 'purple',
  Orange = 'orange',
}

export enum AggregationType {
  Sum = 'sum',
  Count = 'count',
  Mean = 'mean',
  Max = 'max',
  Min = 'min',
}

export enum Granularity {
  Day = 'day',
}

export interface Options {
  colorScheme: ColorScheme;
  aggregation: AggregationType;
  granularity: Granularity;
  showLabels: boolean;
  showTooltip: boolean;
}

export const defaultOptions: Options = {
  colorScheme: ColorScheme.Green,
  aggregation: AggregationType.Sum,
  granularity: Granularity.Day,
  showLabels: true,
  showTooltip: true,
};

export const COLOR_SCHEMES: Record<ColorScheme, string[]> = {
  [ColorScheme.Green]: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  [ColorScheme.Blue]: ['#ebedf0', '#9ecae1', '#6baed6', '#3182bd', '#08519c'],
  [ColorScheme.Red]: ['#ebedf0', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'],
  [ColorScheme.Purple]: ['#ebedf0', '#b4a7d6', '#8e7cc3', '#674ea7', '#351c75'],
  [ColorScheme.Orange]: ['#ebedf0', '#fdbe85', '#fd8d3c', '#e6550d', '#a63603'],
};
