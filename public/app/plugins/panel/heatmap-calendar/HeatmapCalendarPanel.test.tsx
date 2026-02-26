import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentProps } from 'react';

import {
  FieldConfigSource,
  FieldType,
  LoadingState,
  getDefaultTimeRange,
  EventBusSrv,
  toDataFrame,
} from '@grafana/data';

import { HeatmapCalendarPanel } from './HeatmapCalendarPanel';
import { AggregationType, ColorScheme, Granularity, Options } from './types';

type PanelProps = ComponentProps<typeof HeatmapCalendarPanel>;

function setup(overrides: Partial<PanelProps> = {}) {
  const fieldConfig: FieldConfigSource = { defaults: {}, overrides: [] };

  const options: Options = {
    colorScheme: ColorScheme.Green,
    aggregation: AggregationType.Sum,
    granularity: Granularity.Day,
    showLabels: true,
    showTooltip: true,
  };

  const props: PanelProps = {
    id: 1,
    data: { state: LoadingState.Done, timeRange: getDefaultTimeRange(), series: [] },
    timeZone: 'utc',
    options,
    fieldConfig,
    width: 800,
    height: 200,
    renderCounter: 0,
    title: 'Heatmap Calendar',
    transparent: false,
    onFieldConfigChange: () => {},
    onOptionsChange: () => {},
    onChangeTimeRange: () => {},
    replaceVariables: (s: string) => s,
    eventBus: new EventBusSrv(),
    timeRange: getDefaultTimeRange(),
    ...overrides,
  };

  return render(<HeatmapCalendarPanel {...props} />);
}

describe('HeatmapCalendarPanel', () => {
  it('renders the panel container', () => {
    setup();
    expect(screen.getByTestId('heatmap-calendar-panel')).toBeInTheDocument();
  });

  it('renders calendar cells', () => {
    setup();
    const cells = screen.getAllByTestId('heatmap-calendar-cell');
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.length % 7).toBe(0);
  });

  it('renders day labels when showLabels is true', () => {
    setup();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
  });

  it('hides labels when showLabels is false', () => {
    setup({
      options: {
        colorScheme: ColorScheme.Green,
        aggregation: AggregationType.Sum,
        granularity: Granularity.Day,
        showLabels: false,
        showTooltip: true,
      },
    });
    expect(screen.queryByText('Mon')).not.toBeInTheDocument();
  });

  it('renders cells with data', () => {
    const today = new Date();
    const frame = toDataFrame({
      fields: [
        {
          name: 'time',
          type: FieldType.time,
          values: [today.getTime()],
        },
        {
          name: 'value',
          type: FieldType.number,
          values: [42],
        },
      ],
    });

    setup({
      data: { state: LoadingState.Done, timeRange: getDefaultTimeRange(), series: [frame] },
    });

    const cells = screen.getAllByTestId('heatmap-calendar-cell');
    const filledCells = cells.filter((c) => c.getAttribute('fill') !== '#ebedf0');
    expect(filledCells.length).toBeGreaterThan(0);
  });

  it('shows tooltip on hover when enabled', () => {
    const today = new Date();
    const frame = toDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [today.getTime()] },
        { name: 'value', type: FieldType.number, values: [10] },
      ],
    });

    setup({
      data: { state: LoadingState.Done, timeRange: getDefaultTimeRange(), series: [frame] },
    });

    const cells = screen.getAllByTestId('heatmap-calendar-cell');
    fireEvent.mouseEnter(cells[0]);
    const tooltip = screen.queryByTestId('heatmap-calendar-tooltip');
    expect(tooltip).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', () => {
    setup();

    const cells = screen.getAllByTestId('heatmap-calendar-cell');
    fireEvent.mouseEnter(cells[0]);
    fireEvent.mouseLeave(cells[0]);
    expect(screen.queryByTestId('heatmap-calendar-tooltip')).not.toBeInTheDocument();
  });

  it('applies different color schemes', () => {
    const today = new Date();
    const frame = toDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [today.getTime()] },
        { name: 'value', type: FieldType.number, values: [10] },
      ],
    });

    const { unmount } = setup({
      data: { state: LoadingState.Done, timeRange: getDefaultTimeRange(), series: [frame] },
      options: {
        colorScheme: ColorScheme.Blue,
        aggregation: AggregationType.Sum,
        granularity: Granularity.Day,
        showLabels: true,
        showTooltip: true,
      },
    });

    const cells = screen.getAllByTestId('heatmap-calendar-cell');
    const blueCell = cells.find((c) => {
      const fill = c.getAttribute('fill');
      return fill && fill !== '#ebedf0';
    });
    if (blueCell) {
      const fill = blueCell.getAttribute('fill')!;
      expect(['#9ecae1', '#6baed6', '#3182bd', '#08519c']).toContain(fill);
    }
    unmount();
  });
});
