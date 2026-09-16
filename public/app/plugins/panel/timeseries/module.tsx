import { PanelPlugin } from '@grafana/data';
import { t } from '@grafana/i18n';
import { commonOptionsBuilder } from '@grafana/ui';
import { optsWithHideZeros } from '@grafana/ui/internal';
import { addAnnotationOptions } from 'app/features/panel/options/builder/annotations';

import { TimeSeriesPanel } from './TimeSeriesPanel';
import { TimezonesEditor } from './TimezonesEditor';
import { defaultGraphConfig, getGraphFieldConfig } from './config';
import { graphPanelChangedHandler } from './migrations';
import { defaultTimeSeriesOverlayOptions, type FieldConfig, type Options, TimeSeriesOverlayMode } from './panelcfg.gen';
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
      .addRadio({
        path: 'overlay.mode',
        name: t('timeseries.overlay.name-mode', 'Mode'),
        description: t(
          'timeseries.overlay.description-mode',
          'Draw a linear regression or moving average on each series without adding a transformation'
        ),
        category: overlayCategory,
        defaultValue: defaultTimeSeriesOverlayOptions.mode,
        settings: {
          options: [
            { value: TimeSeriesOverlayMode.Off, label: t('timeseries.overlay.mode-options.label-off', 'Off') },
            {
              value: TimeSeriesOverlayMode.LinearRegression,
              label: t('timeseries.overlay.mode-options.label-linear-regression', 'Linear regression'),
            },
            {
              value: TimeSeriesOverlayMode.MovingAverage,
              label: t('timeseries.overlay.mode-options.label-moving-average', 'Moving average'),
            },
          ],
        },
      })
      .addNumberInput({
        path: 'overlay.windowSize',
        name: t('timeseries.overlay.name-window-size', 'Window size'),
        description: t(
          'timeseries.overlay.description-window-size',
          'Number of points included in the trailing moving average'
        ),
        category: overlayCategory,
        defaultValue: defaultTimeSeriesOverlayOptions.windowSize,
        settings: {
          min: 2,
          step: 1,
        },
        showIf: (config) => config.overlay?.mode === TimeSeriesOverlayMode.MovingAverage,
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
