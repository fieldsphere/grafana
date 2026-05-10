import { PanelPlugin } from '@grafana/data';
import { t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { commonOptionsBuilder } from '@grafana/ui';
import { optsWithHideZeros } from '@grafana/ui/internal';
import { addAnnotationOptions } from 'app/features/panel/options/builder/annotations';

import { TimeSeriesPanel } from './TimeSeriesPanel';
import { TimezonesEditor } from './TimezonesEditor';
import { defaultGraphConfig, getGraphFieldConfig } from './config';
import { graphPanelChangedHandler } from './migrations';
import { type FieldConfig, type Options } from './panelcfg.gen';
import { timeseriesPresetsSupplier } from './presets';
import { timeseriesSuggestionsSupplier } from './suggestions';

export const plugin = new PanelPlugin<Options, FieldConfig>(TimeSeriesPanel)
  .setPanelChangeHandler(graphPanelChangedHandler)
  .useFieldConfig(getGraphFieldConfig(defaultGraphConfig))
  .setPanelOptions((builder) => {
    commonOptionsBuilder.addTooltipOptions(builder, false, true, optsWithHideZeros);
    commonOptionsBuilder.addLegendOptions(builder, true, true);

    const legendCategory = [t('timeseries.legend.category', 'Legend')];
    const overlayCategory = [t('timeseries.overlay.category', 'Overlay')];

    if (config.featureToggles.vizLegendFacetedFilter) {
      builder.addBooleanSwitch({
        path: 'legend.enableFacetedFilter',
        name: t('timeseries.legend.name-faceted-filter', 'Faceted filter'),
        category: legendCategory,
        description: t('timeseries.legend.description-faceted-filter', 'Show series visibility filter based on labels'),
        defaultValue: true,
        showIf: (c) => c.legend.showLegend,
      });
    }

    builder
      .addBooleanSwitch({
        path: 'overlay.enabled',
        name: t('timeseries.overlay.name-enable', 'Show overlay'),
        category: overlayCategory,
        description: t('timeseries.overlay.description-enable', 'Render a derived series for each numeric time series'),
        defaultValue: false,
      })
      .addRadio({
        path: 'overlay.type',
        name: t('timeseries.overlay.name-type', 'Overlay type'),
        category: overlayCategory,
        defaultValue: 'movingAverage',
        settings: {
          options: [
            { value: 'movingAverage', label: t('timeseries.overlay.type-moving-average', 'Moving average') },
            { value: 'linearRegression', label: t('timeseries.overlay.type-linear-regression', 'Linear regression') },
          ],
        },
        showIf: (c) => Boolean(c.overlay?.enabled),
      })
      .addNumberInput({
        path: 'overlay.window',
        name: t('timeseries.overlay.name-window', 'Window size'),
        category: overlayCategory,
        description: t('timeseries.overlay.description-window', 'Number of trailing points used for moving average'),
        defaultValue: 10,
        settings: {
          min: 2,
          integer: true,
        },
        showIf: (c) => Boolean(c.overlay?.enabled) && c.overlay?.type !== 'linearRegression',
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
  })
  .setSuggestionsSupplier(timeseriesSuggestionsSupplier)
  .setPresetsSupplier(timeseriesPresetsSupplier)
  .setDataSupport({ annotations: true, alertStates: true });
