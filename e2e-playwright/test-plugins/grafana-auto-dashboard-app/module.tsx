import { AppPlugin } from '@grafana/data';
import { initPluginTranslations } from '@grafana/i18n';

import { App } from './components/App';
import pluginJson from './plugin.json';

await initPluginTranslations(pluginJson.id);

export const plugin = new AppPlugin<{}>().setRootPage(App);
