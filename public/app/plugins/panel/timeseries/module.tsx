import { PanelPlugin } from '@grafana/data';
import { t } from '@grafana/i18n';
import { commonOptionsBuilder } from '@grafana/ui';
import { optsWithHideZeros } from '@grafana/ui/internal';
import { addAnnotationOptions } from 'app/features/panel/options/builder/annotations';

import { TimeSeriesPanel } from './TimeSeriesPanel';
import { TimezonesEditor } from './TimezonesEditor';
import { defaultGraphConfig, getGraphFieldConfig } from './config';
import { graphPanelChangedHandler } from './migrations';
import { MIN_OVERLAY_WINDOW_SIZE } from './overlays';
import { defaultTimeSeriesOverlayOptions, type FieldConfig, type Options, TimeSeriesOverlayType } from './panelcfg.gen';
import { timeseriesPresetsSupplier } from './presets';
import { timeseriesSuggestionsSupplier } from './suggestions';

export const plugin = new PanelPlugin<Options, FieldConfig>(TimeSeriesPanel)
  .setPanelChangeHandler(graphPanelChangedHandler)
  .useFieldConfig(getGraphFieldConfig(defaultGraphConfig))
  .setPanelOptions((builder) => {
    commonOptionsBuilder.addTooltipOptions(builder, false, true, optsWithHideZeros);
    commonOptionsBuilder.addLegendOptions(builder, true, true);

    const legendCategory = [t('timeseries.legend.category', 'Legend')];

    builder.addBooleanSwitch({
      path: 'legend.enableFacetedFilter',
      name: t('timeseries.legend.name-faceted-filter', 'Series visibility'),
      category: legendCategory,
      description: t(
        'timeseries.legend.description-faceted-filter',
        'Enable filter to display series based on labels or names'
      ),
      showIf: (c) => c.legend.showLegend,
    });

    builder.addCustomEditor({
      id: 'timezone',
      name: t('timeseries.name-time-zone', 'Time zone'),
      path: 'timezone',
      category: [t('timeseries.category-axis', 'Axis')],
      editor: TimezonesEditor,
      defaultValue: undefined,
    });

    addAnnotationOptions(builder);

    const overlayCategory = [t('timeseries.overlay.category', 'Overlay')];

    builder
      .addBooleanSwitch({
        path: 'overlay.enabled',
        name: t('timeseries.overlay.name-enabled', 'Show overlay'),
        category: overlayCategory,
        description: t(
          'timeseries.overlay.description-enabled',
          'Draw a derived line on top of each numeric series. Overlay series appear in the graph and legend and are not configured separately.'
        ),
        defaultValue: defaultTimeSeriesOverlayOptions.enabled,
      })
      .addRadio({
        path: 'overlay.type',
        name: t('timeseries.overlay.name-type', 'Type'),
        category: overlayCategory,
        defaultValue: defaultTimeSeriesOverlayOptions.type,
        settings: {
          options: [
            {
              value: TimeSeriesOverlayType.MovingAverage,
              label: t('timeseries.overlay.type-moving-average', 'Moving average'),
            },
            {
              value: TimeSeriesOverlayType.LinearRegression,
              label: t('timeseries.overlay.type-linear-regression', 'Linear regression'),
            },
          ],
        },
        showIf: (c) => Boolean(c.overlay?.enabled),
      })
      .addNumberInput({
        path: 'overlay.windowSize',
        name: t('timeseries.overlay.name-window-size', 'Window'),
        category: overlayCategory,
        description: t(
          'timeseries.overlay.description-window-size',
          'Trailing window length in data points. Minimum 2.'
        ),
        defaultValue: defaultTimeSeriesOverlayOptions.windowSize,
        settings: {
          min: MIN_OVERLAY_WINDOW_SIZE,
          placeholder: String(defaultTimeSeriesOverlayOptions.windowSize),
        },
        showIf: (c) =>
          Boolean(c.overlay?.enabled) &&
          (c.overlay?.type ?? TimeSeriesOverlayType.MovingAverage) === TimeSeriesOverlayType.MovingAverage,
      });
  })
  .setSuggestionsSupplier(timeseriesSuggestionsSupplier)
  .setPresetsSupplier(timeseriesPresetsSupplier)
  .setViewPanelOptions({
    fanout: { enabled: true },
    quickToggles: {
      optionProperties: ['legend.showLegend', 'legend.placement'],
      fieldConfigProperties: ['custom.stacking', 'custom.scaleDistribution'],
    },
  })
  .setDataSupport({ annotations: true, alertStates: true });
