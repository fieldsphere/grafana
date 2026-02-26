import { PanelPlugin } from '@grafana/data';

import { HeatmapCalendarPanel } from './HeatmapCalendarPanel';
import { AggregationType, ColorScheme, defaultOptions, Granularity, Options } from './types';

export const plugin = new PanelPlugin<Options>(HeatmapCalendarPanel).setPanelOptions((builder) => {
  builder
    .addSelect({
      path: 'colorScheme',
      name: 'Color scheme',
      description: 'Color palette for the heatmap cells',
      settings: {
        options: [
          { value: ColorScheme.Green, label: 'Green' },
          { value: ColorScheme.Blue, label: 'Blue' },
          { value: ColorScheme.Red, label: 'Red' },
          { value: ColorScheme.Purple, label: 'Purple' },
          { value: ColorScheme.Orange, label: 'Orange' },
        ],
      },
      defaultValue: defaultOptions.colorScheme,
    })
    .addSelect({
      path: 'aggregation',
      name: 'Aggregation',
      description: 'How to aggregate multiple values per day',
      settings: {
        options: [
          { value: AggregationType.Sum, label: 'Sum' },
          { value: AggregationType.Count, label: 'Count' },
          { value: AggregationType.Mean, label: 'Mean' },
          { value: AggregationType.Max, label: 'Max' },
          { value: AggregationType.Min, label: 'Min' },
        ],
      },
      defaultValue: defaultOptions.aggregation,
    })
    .addSelect({
      path: 'granularity',
      name: 'Granularity',
      description: 'Time granularity for each cell',
      settings: {
        options: [{ value: Granularity.Day, label: 'Day' }],
      },
      defaultValue: defaultOptions.granularity,
    })
    .addBooleanSwitch({
      path: 'showLabels',
      name: 'Show labels',
      description: 'Display month and day labels',
      defaultValue: defaultOptions.showLabels,
    })
    .addBooleanSwitch({
      path: 'showTooltip',
      name: 'Show tooltip',
      description: 'Display tooltip on hover',
      defaultValue: defaultOptions.showTooltip,
    });
});
