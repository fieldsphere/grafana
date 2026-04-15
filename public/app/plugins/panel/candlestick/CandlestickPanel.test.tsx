import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createDataFrame, createTheme, EventBusSrv, FieldType, getDefaultTimeRange, LoadingState } from '@grafana/data';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode, VizOrientation } from '@grafana/schema';
import * as grafanaUI from '@grafana/ui';

import { getPanelProps } from '../test-utils';

import { CandlestickPanel } from './CandlestickPanel';
import { defaultOptions, type Options, VizDisplayMode } from './panelcfg.gen';

const mockUsePanelContext = jest.fn();
const onChangeTimeRange = jest.fn();
const onOptionsChange = jest.fn();

jest.mock('@grafana/ui', () => ({
  ...jest.requireActual('@grafana/ui'),
  usePanelContext: () => mockUsePanelContext(),
  TooltipPlugin2: () => null,
  XAxisInteractionAreaPlugin: () => null,
  KeyboardPlugin: () => null,
  EventBusPlugin: () => null,
}));
jest.mock('../timeseries/plugins/AnnotationPlugin', () => ({
  AnnotationsPlugin: () => null,
}));
jest.mock('../timeseries/plugins/ExemplarsPlugin', () => ({
  ExemplarsPlugin: () => null,
}));
jest.mock('../timeseries/plugins/OutsideRangePlugin', () => ({
  OutsideRangePlugin: () => null,
}));
jest.mock('../timeseries/plugins/ThresholdControlsPlugin', () => ({
  ThresholdControlsPlugin: () => null,
}));

describe('CandlestickPanel advanced controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();

    mockUsePanelContext.mockReturnValue({
      eventsScope: 'global',
      eventBus: new EventBusSrv(),
      sync: () => undefined,
      canAddAnnotations: () => false,
      canExecuteActions: () => false,
    } as unknown as ReturnType<typeof grafanaUI.usePanelContext>);
  });

  it('shows quick range controls including 1D and 5D', () => {
    setup();

    expect(screen.getByTestId('candlestick-range-1D')).toBeVisible();
    expect(screen.getByTestId('candlestick-range-5D')).toBeVisible();
    expect(screen.getByTestId('candlestick-range-7D')).toBeVisible();
    expect(screen.getByTestId('candlestick-range-3M')).toBeVisible();
  });

  it('updates options and time range when selecting 1D', async () => {
    setup();

    await userEvent.click(screen.getByTestId('candlestick-range-1D'));

    expect(onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedQuickRange: '1D',
      })
    );
    expect(onChangeTimeRange).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.any(Number),
        to: expect.any(Number),
      })
    );
  });

  it('toggles SMA/EMA/RSI and log controls', async () => {
    setup();

    await userEvent.click(screen.getByTestId('candlestick-toggle-sma'));
    await userEvent.click(screen.getByTestId('candlestick-toggle-ema'));
    await userEvent.click(screen.getByTestId('candlestick-toggle-rsi'));
    await userEvent.click(screen.getByTestId('candlestick-toggle-log-scale'));

    expect(onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        indicators: expect.objectContaining({ showSMA: true }),
      })
    );
    expect(onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        indicators: expect.objectContaining({ showEMA: true }),
      })
    );
    expect(onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        indicators: expect.objectContaining({ showRSI: true }),
      })
    );
    expect(onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        isLogScale: true,
      })
    );
  });

  it('renders RSI secondary panel when enabled', () => {
    const { container } = setup({
      indicators: {
        showSMA: false,
        smaPeriod: 20,
        showEMA: false,
        emaPeriod: 20,
        showRSI: true,
        rsiPeriod: 14,
      },
    });

    // main chart + RSI panel both mount their own uPlot root.
    expect(container.querySelectorAll('.uplot').length).toBeGreaterThanOrEqual(2);
  });

  it('uses session persisted log scale preference', async () => {
    window.sessionStorage.setItem('grafana.candlestick.log-scale.1', 'true');

    setup({
      isLogScale: false,
      persistLogScaleInSession: true,
    });

    await act(async () => {
      await userEvent.click(screen.getByTestId('candlestick-toggle-log-scale'));
    });
    expect(onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        isLogScale: false,
      })
    );
  });
});

function setup(optionsOverrides: Partial<Options> = {}) {
  const series = [
    createDataFrame({
      fields: [
        { name: 'time', type: FieldType.time as FieldType, values: [1, 2, 3, 4, 5] },
        { name: 'open', type: FieldType.number, values: [10, 11, 12, 13, 14] },
        { name: 'high', type: FieldType.number, values: [11, 12, 13, 14, 15] },
        { name: 'low', type: FieldType.number, values: [9, 10, 11, 12, 13] },
        { name: 'close', type: FieldType.number, values: [10.5, 11.5, 12.5, 13.5, 14.5] },
        { name: 'volume', type: FieldType.number, values: [100, 120, 140, 160, 180] },
      ],
    }),
  ];

  const options: Options = {
    ...defaultOptions,
    mode: VizDisplayMode.CandlesVolume,
    legend: {
      showLegend: false,
      displayMode: LegendDisplayMode.List,
      placement: 'bottom',
      calcs: [],
      width: undefined,
    },
    tooltip: {
      mode: TooltipDisplayMode.Multi,
      sort: SortOrder.None,
      maxHeight: 300,
      maxWidth: 300,
      hideZeros: false,
      hoverProximity: 30,
    },
    annotations: {
      list: [],
    },
    orientation: VizOrientation.Auto,
    ...optionsOverrides,
  } as Options;

  const props = getPanelProps<Options>(options, {
    onOptionsChange,
    onChangeTimeRange,
    data: {
      state: LoadingState.Done,
      series,
      annotations: [],
      structureRev: 1,
      timeRange: getDefaultTimeRange(),
    },
    width: 900,
    height: 520,
    id: 1,
  });

  return render(<CandlestickPanel {...props} />, { theme: createTheme() });
}
