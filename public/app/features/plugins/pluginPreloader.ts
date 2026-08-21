import type { AppPluginConfig } from '@grafana/data';
import { getPluginSettings } from '@grafana/runtime/unstable';
import { contextSrv } from 'app/core/services/context_srv';

import { pluginImporter } from './importer/pluginImporter';

import { createStructuredLogger } from '@grafana/data';
const logger = createStructuredLogger('features.plugins');

const preloadPromises = new Map<string, Promise<void>>();

export const clearPreloadedPluginsCache = () => {
  preloadPromises.clear();
};

export async function preloadPlugins(apps: AppPluginConfig[] = []) {
  // Create preload promises for each app, reusing existing promises if already loading
  const promises = apps.map((app) => {
    if (!preloadPromises.has(app.id)) {
      preloadPromises.set(app.id, preload(app));
    }
    return preloadPromises.get(app.id)!;
  });

  await Promise.all(promises);
}

async function preload(config: AppPluginConfig): Promise<void> {
  const showErrorAlert = contextSrv.user.orgRole !== '';

  try {
    const meta = await getPluginSettings(config.id, showErrorAlert);
    await pluginImporter.importApp(meta);
  } catch (error) {
    if (!showErrorAlert) {
      return;
    }

    logger.error(`[Plugins] Failed to preload plugin: ${config.path} (version: ${config.version})`, error);
  }
}
