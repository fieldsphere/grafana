import { LegendDisplayMode, SortOrder, TooltipDisplayMode } from '@grafana/schema';

import { defaultOptions as defaultOptionsBase, type Options } from './panelcfg.gen';
import { defaultTechnicalIndicatorOptions } from './indicators';

export const defaultOptions: Partial<Options> = {
  ...defaultOptionsBase,
  indicators: defaultTechnicalIndicatorOptions,
  // TODO: This should be included in the cue schema in the future.
  legend: {
    displayMode: LegendDisplayMode.List,
    showLegend: true,
    placement: 'bottom',
    calcs: [],
  },
  tooltip: {
    mode: TooltipDisplayMode.Multi,
    sort: SortOrder.None,
  },
};
