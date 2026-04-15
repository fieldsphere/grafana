import { type Field, FieldType, getFieldDisplayName, type PanelOptionsEditorBuilder, PanelPlugin } from '@grafana/data';
import { t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { type GraphFieldConfig } from '@grafana/schema';
import { commonOptionsBuilder } from '@grafana/ui';
import { addAnnotationOptions } from 'app/features/panel/options/builder/annotations';

import { defaultGraphConfig, getGraphFieldConfig } from '../timeseries/config';

import { CandlestickPanel } from './CandlestickPanel';
import { defaultOptions } from './defaultOptions';
import {
  type CandlestickData,
  getCandlestickFieldsInfo,
  type FieldPickerInfo,
  prepareCandlestickFields,
} from './fields';
import {
  defaultCandlestickColors,
  type Options,
  VizDisplayMode,
  ColorStrategy,
  CandleStyle,
  QuickRangePreset,
  defaultTechnicalIndicatorOptions,
} from './panelcfg.gen';
import { candlestickSuggestionSupplier } from './suggestions';

const numericFieldFilter = (f: Field) => f.type === FieldType.number;

function addFieldPicker(
  builder: PanelOptionsEditorBuilder<Options>,
  info: FieldPickerInfo,
  data: CandlestickData | null,
  category?: string[]
) {
  let placeholderText = 'Auto ';

  if (data) {
    const current = data[info.key];

    if (current?.config) {
      placeholderText += '= ' + getFieldDisplayName(current);

      if (current === data?.open && info.key !== 'open') {
        placeholderText += ` (${info.defaults.join(',')})`;
      }
    } else {
      placeholderText += `(${info.defaults.join(',')})`;
    }
  }

  builder.addFieldNamePicker({
    path: `fields.${info.key}`,
    name: info.name,
    description: info.description,
    category,
    settings: {
      filter: numericFieldFilter,
      placeholderText,
    },
  });
}

export const plugin = new PanelPlugin<Options, GraphFieldConfig>(CandlestickPanel)
  .useFieldConfig(getGraphFieldConfig(defaultGraphConfig))
  .setPanelOptions((builder, context) => {
    const category = [t('candlestick.category-candlestick', 'Candlestick')];
    const advancedCategory = [t('candlestick.category-advanced-charting', 'Advanced charting')];
    const opts = context.options ?? defaultOptions;
    const info = prepareCandlestickFields(context.data, opts, config.theme2);
    builder
      .addRadio({
        path: 'mode',
        name: t('candlestick.name-mode', 'Mode'),
        category,
        description: '',
        defaultValue: defaultOptions.mode,
        settings: {
          options: [
            { label: t('candlestick.mode-options.label-candles', 'Candles'), value: VizDisplayMode.Candles },
            { label: t('candlestick.mode-options.label-volume', 'Volume'), value: VizDisplayMode.Volume },
            { label: t('candlestick.mode-options.label-both', 'Both'), value: VizDisplayMode.CandlesVolume },
          ],
        },
      })
      .addRadio({
        path: 'candleStyle',
        name: t('candlestick.name-candle-style', 'Candle style'),
        category,
        description: '',
        defaultValue: defaultOptions.candleStyle,
        settings: {
          options: [
            { label: t('candlestick.candle-style-options.label-candles', 'Candles'), value: CandleStyle.Candles },
            { label: t('candlestick.candle-style-options.label-ohlc-bars', 'OHLC Bars'), value: CandleStyle.OHLCBars },
          ],
        },
        showIf: (opts) => opts.mode !== VizDisplayMode.Volume,
      })
      .addRadio({
        path: 'colorStrategy',
        name: t('candlestick.name-color-strategy', 'Color strategy'),
        category,
        description: '',
        defaultValue: defaultOptions.colorStrategy,
        settings: {
          options: [
            {
              label: t('candlestick.color-strategy-options.label-since-open', 'Since Open'),
              value: ColorStrategy.OpenClose,
            },
            {
              label: t('candlestick.color-strategy-options.label-since-prior-close', 'Since Prior Close'),
              value: ColorStrategy.CloseClose,
            },
          ],
        },
      })
      .addColorPicker({
        path: 'colors.up',
        name: t('candlestick.name-up-color', 'Up color'),
        category,
        defaultValue: defaultCandlestickColors.up,
      })
      .addColorPicker({
        path: 'colors.down',
        name: t('candlestick.name-down-color', 'Down color'),
        category,
        defaultValue: defaultCandlestickColors.down,
      });

    const candlestickFieldsInfo = getCandlestickFieldsInfo();
    addFieldPicker(builder, candlestickFieldsInfo.open, info, category);
    if (opts.mode !== VizDisplayMode.Volume) {
      addFieldPicker(builder, candlestickFieldsInfo.high, info, category);
      addFieldPicker(builder, candlestickFieldsInfo.low, info, category);
    }
    addFieldPicker(builder, candlestickFieldsInfo.close, info, category);

    if (opts.mode !== VizDisplayMode.Candles) {
      addFieldPicker(builder, candlestickFieldsInfo.volume, info, category);
    }

    builder.addRadio({
      path: 'includeAllFields',
      name: t('candlestick.name-additional-fields', 'Additional fields'),
      category,
      description: t(
        'candlestick.description-additional-fields',
        'Use standard timeseries options to configure any fields not mapped above'
      ),
      defaultValue: defaultOptions.includeAllFields,
      settings: {
        options: [
          { label: t('candlestick.additional-fields-options.label-ignore', 'Ignore'), value: false },
          { label: t('candlestick.additional-fields-options.label-include', 'Include'), value: true },
        ],
      },
    });

    builder
      .addBooleanSwitch({
        path: 'showQuickRangeControls',
        name: t('candlestick.name-show-time-range-controls', 'Show time range controls'),
        category: advancedCategory,
        description: t(
          'candlestick.description-show-time-range-controls',
          'Show period controls (1D, 5D, 7D, 3M, 6M, 1Y) directly above the chart'
        ),
        defaultValue: true,
      })
      .addRadio({
        path: 'selectedQuickRange',
        name: t('candlestick.name-default-time-range', 'Default time range'),
        category: advancedCategory,
        description: t('candlestick.description-default-time-range', 'Period selected by default for this panel'),
        defaultValue: QuickRangePreset.D7,
        settings: {
          options: [
            { label: '1D', value: QuickRangePreset.D1 },
            { label: '5D', value: QuickRangePreset.D5 },
            { label: '7D', value: QuickRangePreset.D7 },
            { label: '3M', value: QuickRangePreset.M3 },
            { label: '6M', value: QuickRangePreset.M6 },
            { label: '1Y', value: QuickRangePreset.Y1 },
          ],
        },
        showIf: (currentOptions) => currentOptions.showQuickRangeControls !== false,
      })
      .addBooleanSwitch({
        path: 'isLogScale',
        name: t('candlestick.name-logarithmic-scale', 'Logarithmic scale'),
        category: advancedCategory,
        description: t('candlestick.description-logarithmic-scale', 'Use logarithmic scale for price comparison'),
        defaultValue: false,
      })
      .addBooleanSwitch({
        path: 'persistLogScaleInSession',
        name: t('candlestick.name-persist-log-scale-session', 'Persist log scale in session'),
        category: advancedCategory,
        description: t(
          'candlestick.description-persist-log-scale-session',
          'Keep the log scale toggle for this panel in the current browser session'
        ),
        defaultValue: true,
      })
      .addBooleanSwitch({
        path: 'indicators.showSMA',
        name: t('candlestick.name-show-sma', 'Show SMA'),
        category: advancedCategory,
        description: t('candlestick.description-show-sma', 'Overlay Simple Moving Average on the price chart'),
        defaultValue: defaultTechnicalIndicatorOptions.showSMA,
      })
      .addNumberInput({
        path: 'indicators.smaPeriod',
        name: t('candlestick.name-sma-period', 'SMA period'),
        category: advancedCategory,
        description: t('candlestick.description-sma-period', 'Number of points used in SMA calculation'),
        defaultValue: defaultTechnicalIndicatorOptions.smaPeriod,
        settings: {
          min: 2,
          max: 500,
          integer: true,
        },
        showIf: (currentOptions) => currentOptions.indicators?.showSMA === true,
      })
      .addBooleanSwitch({
        path: 'indicators.showEMA',
        name: t('candlestick.name-show-ema', 'Show EMA'),
        category: advancedCategory,
        description: t('candlestick.description-show-ema', 'Overlay Exponential Moving Average on the price chart'),
        defaultValue: defaultTechnicalIndicatorOptions.showEMA,
      })
      .addNumberInput({
        path: 'indicators.emaPeriod',
        name: t('candlestick.name-ema-period', 'EMA period'),
        category: advancedCategory,
        description: t('candlestick.description-ema-period', 'Number of points used in EMA smoothing'),
        defaultValue: defaultTechnicalIndicatorOptions.emaPeriod,
        settings: {
          min: 2,
          max: 500,
          integer: true,
        },
        showIf: (currentOptions) => currentOptions.indicators?.showEMA === true,
      })
      .addBooleanSwitch({
        path: 'indicators.showRSI',
        name: t('candlestick.name-show-rsi', 'Show RSI panel'),
        category: advancedCategory,
        description: t('candlestick.description-show-rsi', 'Display Relative Strength Index in a secondary panel'),
        defaultValue: defaultTechnicalIndicatorOptions.showRSI,
      })
      .addNumberInput({
        path: 'indicators.rsiPeriod',
        name: t('candlestick.name-rsi-period', 'RSI period'),
        category: advancedCategory,
        description: t('candlestick.description-rsi-period', 'Number of points used in RSI calculation'),
        defaultValue: defaultTechnicalIndicatorOptions.rsiPeriod,
        settings: {
          min: 2,
          max: 500,
          integer: true,
        },
        showIf: (currentOptions) => currentOptions.indicators?.showRSI === true,
      });

    commonOptionsBuilder.addTooltipOptions(builder, false, true);
    commonOptionsBuilder.addLegendOptions(builder, true, true);
    addAnnotationOptions(builder);
  })
  .setDataSupport({ annotations: true, alertStates: true })
  .setSuggestionsSupplier(candlestickSuggestionSupplier);
