// this file is pretty much a copy-paste of TimeSeriesPanel.tsx :(
// with some extra renderers passed to the <TimeSeries> component

import { css } from '@emotion/css';
import { useEffect, useMemo, useState } from 'react';
import type uPlot from 'uplot';

import {
  type DataFrame,
  type Field,
  type GrafanaTheme2,
  getDisplayProcessor,
  type PanelProps,
  useDataLinksContext,
} from '@grafana/data';
import { t } from '@grafana/i18n';
import { config, PanelDataErrorView } from '@grafana/runtime';
import { DashboardCursorSync, ScaleDistribution, TooltipDisplayMode } from '@grafana/schema';
import {
  Button,
  ButtonGroup,
  EventBusPlugin,
  KeyboardPlugin,
  TooltipPlugin2,
  type UPlotConfigBuilder,
  usePanelContext,
  useStyles2,
  useTheme2,
  XAxisInteractionAreaPlugin,
} from '@grafana/ui';
import { type AxisProps, type ScaleProps, type TimeRange2, TooltipHoverMode } from '@grafana/ui/internal';
import { TimeSeries } from 'app/core/components/TimeSeries/TimeSeries';

import { TimeSeriesTooltip } from '../timeseries/TimeSeriesTooltip';
import { AnnotationsPlugin } from '../timeseries/plugins/AnnotationPlugin';
import { ExemplarsPlugin } from '../timeseries/plugins/ExemplarsPlugin';
import { OutsideRangePlugin } from '../timeseries/plugins/OutsideRangePlugin';
import { ThresholdControlsPlugin } from '../timeseries/plugins/ThresholdControlsPlugin';
import { getXAnnotationFrames } from '../timeseries/plugins/utils';

import { prepareCandlestickFields } from './fields';
import {
  applyTechnicalIndicators,
  getRangeStart,
  quickRangePresets,
  resolveTechnicalIndicatorOptions,
  type QuickRangePreset,
} from './indicators';
import { defaultCandlestickColors, type Options, VizDisplayMode } from './panelcfg.gen';
import { drawMarkers, type FieldIndices } from './utils';

interface CandlestickPanelProps extends PanelProps<Options> {}

const CONTROL_BAR_HEIGHT = 40;
const CHART_GAP = 8;

export const CandlestickPanel = ({
  data,
  id,
  timeRange,
  timeZone,
  width,
  height,
  options,
  fieldConfig,
  onChangeTimeRange,
  replaceVariables,
  onOptionsChange,
}: CandlestickPanelProps) => {
  const {
    sync,
    eventsScope,
    canAddAnnotations,
    onThresholdsChange,
    canEditThresholds,
    showThresholds,
    eventBus,
    canExecuteActions,
  } = usePanelContext();

  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const { dataLinkPostProcessor } = useDataLinksContext();
  const cursorSync = sync?.() ?? DashboardCursorSync.Off;
  const userCanExecuteActions = useMemo(() => canExecuteActions?.() ?? false, [canExecuteActions]);
  const indicators = useMemo(() => resolveTechnicalIndicatorOptions(options), [options]);
  const logScaleStorageKey = `grafana.candlestick.log-scale.${id}`;

  const [selectedRange, setSelectedRange] = useState<QuickRangePreset>(
    (options.selectedQuickRange as QuickRangePreset | undefined) ?? '7D'
  );
  const [isLogScaleEnabled, setIsLogScaleEnabled] = useState(Boolean(options.isLogScale));

  // temp range set for adding new annotation set by TooltipPlugin2, consumed by AnnotationPlugin2
  const [newAnnotationRange, setNewAnnotationRange] = useState<TimeRange2 | null>(null);

  useEffect(() => {
    setSelectedRange((options.selectedQuickRange as QuickRangePreset | undefined) ?? '7D');
  }, [options.selectedQuickRange]);

  useEffect(() => {
    if (options.persistLogScaleInSession === false || typeof window === 'undefined') {
      setIsLogScaleEnabled(Boolean(options.isLogScale));
      return;
    }

    const persisted = window.sessionStorage.getItem(logScaleStorageKey);
    if (persisted == null) {
      setIsLogScaleEnabled(Boolean(options.isLogScale));
      return;
    }

    setIsLogScaleEnabled(persisted === 'true');
  }, [logScaleStorageKey, options.isLogScale, options.persistLogScaleInSession]);

  const info = useMemo(() => prepareCandlestickFields(data.series, options, theme, timeRange), [data.series, options, theme, timeRange]);

  const indicatorsResult = useMemo(() => {
    if (!info) {
      return null;
    }

    return applyTechnicalIndicators(info.frame, info.names.close, indicators);
  }, [info, indicators]);

  const { renderers, tweakScale, tweakAxis, shouldRenderPrice } = useMemo(() => {
    let tweakScale = (opts: ScaleProps, forField: Field) => opts;
    let tweakAxis = (opts: AxisProps, forField: Field) => opts;

    const doNothing = {
      renderers: [],
      tweakScale,
      tweakAxis,
      shouldRenderPrice: false,
    };

    if (!info) {
      return doNothing;
    }

    // Un-encoding the already parsed special fields
    // This takes currently matched fields and saves the name so they can be looked up by name later
    // ¯\_(ツ)_/¯  someday this can make more sense!
    const fieldMap = info.names;
    if (!Object.keys(fieldMap).length) {
      return doNothing;
    }

    const { mode, candleStyle, colorStrategy } = options;
    const colors = { ...defaultCandlestickColors, ...options.colors };
    const { open, high, low, close, volume } = fieldMap;

    if (open == null || close == null) {
      return doNothing;
    }

    let volumeAlpha = 0.5;
    let volumeIdx = -1;
    let shouldRenderVolume = false;

    // find volume field and set overrides
    if (volume != null && mode !== VizDisplayMode.Candles) {
      const volumeField = info.volume!;

      if (volumeField != null) {
        shouldRenderVolume = true;

        const { fillOpacity } = volumeField.config.custom ?? {};
        if (fillOpacity) {
          volumeAlpha = fillOpacity / 100;
        }

        // we only want to put volume on own shorter axis when rendered with price
        if (mode !== VizDisplayMode.Volume) {
          volumeField.config = { ...volumeField.config };
          volumeField.config.unit = 'short';
          volumeField.display = getDisplayProcessor({
            field: volumeField,
            theme: config.theme2,
          });

          tweakAxis = (opts: AxisProps, forField: Field) => {
            if (forField.name === info.volume?.name) {
              const filter = (u: uPlot, splits: number[]) => {
                const croppedSplits = [];
                const max = u.series[volumeIdx].max;

                for (let index = 0; index < splits.length; index++) {
                  croppedSplits.push(splits[index]);
                  if (max && splits[index] > max) {
                    break;
                  }
                }

                return croppedSplits;
              };

              opts.space = 20;
              opts.filter = filter;
              opts.ticks = { ...opts.ticks, filter };
            }

            return opts;
          };

          tweakScale = (opts: ScaleProps, forField: Field) => {
            if (forField.name === info.volume?.name) {
              opts.range = (_u: uPlot, _min: number, max: number) => [0, max * 7];
            }

            return opts;
          };
        }
      }
    }

    const shouldRenderPrice = mode !== VizDisplayMode.Volume && high != null && low != null;
    if (!shouldRenderPrice && !shouldRenderVolume) {
      return doNothing;
    }

    let fields: Record<string, string> = {};
    const indicesOnly: string[] = [];

    if (shouldRenderPrice) {
      fields = { open, high: high!, low: low!, close };
    } else {
      // these fields should not be omitted from normal rendering if they arent rendered
      // as part of price markers. they're only here so we can get back their indicies in the
      // init callback below. TODO: remove this when field mapping happens in the panel instead of deep
      indicesOnly.push(open, close);
    }

    if (shouldRenderVolume) {
      fields.volume = volume!;
      fields.open = open;
      fields.close = close;
    }

    if (isLogScaleEnabled && shouldRenderPrice) {
      const previousTweakScale = tweakScale;
      tweakScale = (opts: ScaleProps, forField: Field) => {
        const next = previousTweakScale({ ...opts }, forField);
        if (forField.name === info.volume?.name) {
          return next;
        }

        return {
          ...next,
          distribution: ScaleDistribution.Log,
        };
      };
    }

    return {
      shouldRenderPrice,
      renderers: [
        {
          fieldMap: fields,
          indicesOnly,
          init: (builder: UPlotConfigBuilder, fieldIndices: FieldIndices) => {
            volumeIdx = fieldIndices.volume!;

            builder.addHook(
              'drawAxes',
              drawMarkers({
                mode,
                fields: fieldIndices,
                upColor: config.theme2.visualization.getColorByName(colors.up),
                downColor: config.theme2.visualization.getColorByName(colors.down),
                flatColor: config.theme2.visualization.getColorByName(colors.flat),
                volumeAlpha,
                colorStrategy,
                candleStyle,
                flatAsUp: true,
              })
            );
          },
        },
      ],
      tweakScale,
      tweakAxis,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info, isLogScaleEnabled, options]);

  if (!info) {
    return (
      <PanelDataErrorView
        panelId={id}
        fieldConfig={fieldConfig}
        data={data}
        needsTimeField={true}
        needsNumberField={true}
      />
    );
  }

  if (shouldRenderPrice && renderers.length > 0) {
    // hide series from legend that are rendered as composite markers
    for (const key in renderers[0].fieldMap) {
      const field: Field = (info as Record<string, Field>)[key];
      field.config = {
        ...field.config,
        custom: {
          ...field.config.custom,
          hideFrom: { legend: true, tooltip: false, viz: false },
        },
      };
    }
  }

  const enableAnnotationCreation = Boolean(canAddAnnotations?.());
  const chartFrame = indicatorsResult?.mainFrame ?? info.frame;
  const rsiFrame = indicatorsResult?.rsiFrame;
  const showRsiPanel = Boolean(rsiFrame && indicators.showRSI);
  const availableChartHeight = Math.max(
    140,
    height - CONTROL_BAR_HEIGHT - (showRsiPanel ? CHART_GAP : 0)
  );
  const mainChartHeight = showRsiPanel ? Math.max(120, Math.round(availableChartHeight * 0.72)) : availableChartHeight;
  const rsiChartHeight = showRsiPanel ? Math.max(80, availableChartHeight - mainChartHeight) : 0;

  const updateIndicators = (patch: Partial<typeof indicators>) => {
    onOptionsChange({
      ...options,
      indicators: {
        ...indicators,
        ...patch,
      },
    });
  };

  const onSelectRange = (preset: QuickRangePreset) => {
    setSelectedRange(preset);
    onOptionsChange({
      ...options,
      selectedQuickRange: preset as Options['selectedQuickRange'],
    });

    const to = Date.now();
    onChangeTimeRange({
      from: getRangeStart(to, preset),
      to,
    });
  };

  const onToggleLogScale = () => {
    const next = !isLogScaleEnabled;
    setIsLogScaleEnabled(next);

    if (options.persistLogScaleInSession !== false && typeof window !== 'undefined') {
      window.sessionStorage.setItem(logScaleStorageKey, `${next}`);
    }

    onOptionsChange({
      ...options,
      isLogScale: next,
    });
  };

  const renderMainChartPlugins = (chartDataFrame: DataFrame) => (uplotConfig: UPlotConfigBuilder, alignedFrame: DataFrame) => (
    <>
      <KeyboardPlugin config={uplotConfig} />
      {cursorSync !== DashboardCursorSync.Off && <EventBusPlugin config={uplotConfig} eventBus={eventBus} frame={alignedFrame} />}
      <XAxisInteractionAreaPlugin config={uplotConfig} queryZoom={onChangeTimeRange} />
      {options.tooltip.mode !== TooltipDisplayMode.None && (
        <TooltipPlugin2
          config={uplotConfig}
          hoverMode={options.tooltip.mode === TooltipDisplayMode.Single ? TooltipHoverMode.xOne : TooltipHoverMode.xAll}
          queryZoom={onChangeTimeRange}
          clientZoom={true}
          syncMode={cursorSync}
          syncScope={eventsScope}
          getDataLinks={(seriesIdx, dataIdx) =>
            chartDataFrame.fields[seriesIdx].getLinks?.({ valueRowIndex: dataIdx }) ?? []
          }
          render={(u, dataIdxs, seriesIdx, isPinned = false, dismiss, timeRange2, viaSync, dataLinks) => {
            if (enableAnnotationCreation && timeRange2 != null) {
              setNewAnnotationRange(timeRange2);
              dismiss();
              return;
            }

            const annotate = () => {
              const xVal = u.posToVal(u.cursor.left!, 'x');
              setNewAnnotationRange({ from: xVal, to: xVal });
              dismiss();
            };

            return (
              <TimeSeriesTooltip
                series={chartDataFrame}
                dataIdxs={dataIdxs}
                seriesIdx={seriesIdx}
                mode={viaSync ? TooltipDisplayMode.Multi : options.tooltip.mode}
                sortOrder={options.tooltip.sort}
                isPinned={isPinned}
                annotate={enableAnnotationCreation ? annotate : undefined}
                maxHeight={options.tooltip.maxHeight}
                replaceVariables={replaceVariables}
                dataLinks={dataLinks}
                canExecuteActions={userCanExecuteActions}
              />
            );
          }}
          maxWidth={options.tooltip.maxWidth}
        />
      )}
      <AnnotationsPlugin
        replaceVariables={replaceVariables}
        options={options.annotations}
        annotations={data.annotations}
        config={uplotConfig}
        timeZone={timeZone}
        newRange={newAnnotationRange}
        setNewRange={setNewAnnotationRange}
      />
      <OutsideRangePlugin config={uplotConfig} onChangeTimeRange={onChangeTimeRange} />
      {data.annotations && (
        <ExemplarsPlugin
          config={uplotConfig}
          exemplars={data.annotations}
          timeZone={timeZone}
          maxHeight={options.tooltip.maxHeight}
          maxWidth={options.tooltip.maxWidth}
        />
      )}
      {((canEditThresholds && onThresholdsChange) || showThresholds) && (
        <ThresholdControlsPlugin
          config={uplotConfig}
          fieldConfig={fieldConfig}
          onThresholdsChange={canEditThresholds ? onThresholdsChange : undefined}
        />
      )}
    </>
  );

  const renderRsiChartPlugins = (rsiDataFrame: DataFrame) => (uplotConfig: UPlotConfigBuilder) => (
    <>
      <XAxisInteractionAreaPlugin config={uplotConfig} queryZoom={onChangeTimeRange} />
      {options.tooltip.mode !== TooltipDisplayMode.None && (
        <TooltipPlugin2
          config={uplotConfig}
          hoverMode={options.tooltip.mode === TooltipDisplayMode.Single ? TooltipHoverMode.xOne : TooltipHoverMode.xAll}
          queryZoom={onChangeTimeRange}
          clientZoom={true}
          syncMode={cursorSync}
          syncScope={eventsScope}
          getDataLinks={(seriesIdx, dataIdx) =>
            rsiDataFrame.fields[seriesIdx].getLinks?.({ valueRowIndex: dataIdx }) ?? []
          }
          render={(_u, dataIdxs, seriesIdx, isPinned = false, _dismiss, _timeRange2, viaSync, dataLinks) => (
            <TimeSeriesTooltip
              series={rsiDataFrame}
              dataIdxs={dataIdxs}
              seriesIdx={seriesIdx}
              mode={viaSync ? TooltipDisplayMode.Multi : options.tooltip.mode}
              sortOrder={options.tooltip.sort}
              isPinned={isPinned}
              maxHeight={options.tooltip.maxHeight}
              replaceVariables={replaceVariables}
              dataLinks={dataLinks}
              canExecuteActions={userCanExecuteActions}
            />
          )}
          maxWidth={options.tooltip.maxWidth}
        />
      )}
    </>
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.controlBar} data-testid="candlestick-advanced-controls">
        {options.showQuickRangeControls !== false && (
          <ButtonGroup>
            {quickRangePresets.map((preset) => (
              <Button
                key={preset.label}
                size="sm"
                variant={selectedRange === preset.label ? 'primary' : 'secondary'}
                onClick={() => onSelectRange(preset.label)}
                data-testid={`candlestick-range-${preset.label}`}
              >
                {preset.label}
              </Button>
            ))}
          </ButtonGroup>
        )}
        <ButtonGroup>
          <Button
            size="sm"
            variant={indicators.showSMA ? 'primary' : 'secondary'}
            onClick={() => updateIndicators({ showSMA: !indicators.showSMA })}
            data-testid="candlestick-toggle-sma"
          >
            {t('candlestick.control-sma', 'SMA')}
          </Button>
          <Button
            size="sm"
            variant={indicators.showEMA ? 'primary' : 'secondary'}
            onClick={() => updateIndicators({ showEMA: !indicators.showEMA })}
            data-testid="candlestick-toggle-ema"
          >
            {t('candlestick.control-ema', 'EMA')}
          </Button>
          <Button
            size="sm"
            variant={indicators.showRSI ? 'primary' : 'secondary'}
            onClick={() => updateIndicators({ showRSI: !indicators.showRSI })}
            data-testid="candlestick-toggle-rsi"
          >
            {t('candlestick.control-rsi', 'RSI')}
          </Button>
          <Button
            size="sm"
            variant={isLogScaleEnabled ? 'primary' : 'secondary'}
            onClick={onToggleLogScale}
            data-testid="candlestick-toggle-log-scale"
          >
            {t('candlestick.control-log', 'Log')}
          </Button>
        </ButtonGroup>
      </div>
      <TimeSeries
        frames={[chartFrame]}
        structureRev={data.structureRev}
        timeRange={timeRange}
        timeZone={timeZone}
        width={width}
        height={mainChartHeight}
        legend={options.legend}
        renderers={renderers}
        tweakAxis={tweakAxis}
        tweakScale={tweakScale}
        options={options}
        replaceVariables={replaceVariables}
        dataLinkPostProcessor={dataLinkPostProcessor}
        cursorSync={cursorSync}
        annotationLanes={options.annotations?.multiLane ? getXAnnotationFrames(data.annotations).length : undefined}
      >
        {renderMainChartPlugins(chartFrame)}
      </TimeSeries>
      {showRsiPanel && rsiFrame && (
        <div className={styles.rsiPanel}>
          <TimeSeries
            frames={[rsiFrame]}
            structureRev={data.structureRev}
            timeRange={timeRange}
            timeZone={timeZone}
            width={width}
            height={rsiChartHeight}
            legend={options.legend}
            options={options}
            replaceVariables={replaceVariables}
            dataLinkPostProcessor={dataLinkPostProcessor}
            cursorSync={cursorSync}
            tweakScale={(scale, field) =>
              field.name.startsWith('RSI') ? { ...scale, distribution: ScaleDistribution.Linear, min: 0, max: 100 } : scale
            }
          >
            {renderRsiChartPlugins(rsiFrame)}
          </TimeSeries>
        </div>
      )}
    </div>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    wrapper: css({
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),
    controlBar: css({
      minHeight: `${CONTROL_BAR_HEIGHT}px`,
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(1),
    }),
    rsiPanel: css({
      marginTop: `${CHART_GAP}px`,
    }),
  };
}
