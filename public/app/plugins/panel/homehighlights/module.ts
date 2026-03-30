import { PanelPlugin } from '@grafana/data';

import { HomeHighlightsPanel } from './HomeHighlights';

export const plugin = new PanelPlugin(HomeHighlightsPanel).setNoPadding();
