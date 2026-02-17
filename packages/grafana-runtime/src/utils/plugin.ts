import { PanelPlugin } from '@grafana/data';

import { config } from '../config';
import { createMonitoringLogger } from './logging';

const logger = createMonitoringLogger('runtime.plugin');

/**
 * Option to specify a plugin css that should be applied for the dark
 * and the light theme.
 *
 * @public
 */
export interface PluginCssOptions {
  light: string;
  dark: string;
}

/**
 * Use this to load css for a Grafana plugin by specifying a {@link PluginCssOptions}
 * containing styling for the dark and the light theme.
 *
 * @param options - plugin styling for light and dark theme.
 * @public
 */
export async function loadPluginCss(options: PluginCssOptions): Promise<System.Module | void> {
  const cssPath = config.bootData.user.theme === 'light' ? options.light : options.dark;

  try {
    return window.System.import(cssPath);
  } catch (err) {
    if (err instanceof Error) {
      logger.logError(err, { operation: 'loadPluginCss', cssPath });
      return;
    }

    logger.logWarning('Failed to load plugin CSS', {
      operation: 'loadPluginCss',
      cssPath,
      error: String(err),
    });
  }
}

interface PluginImportUtils {
  importPanelPlugin: (id: string) => Promise<PanelPlugin>;
  getPanelPluginFromCache: (id: string) => PanelPlugin | undefined;
}

let pluginImportUtils: PluginImportUtils | undefined;

export function setPluginImportUtils(utils: PluginImportUtils) {
  if (pluginImportUtils) {
    throw new Error('pluginImportUtils should only be set once, when Grafana is starting.');
  }

  pluginImportUtils = utils;
}

export function getPluginImportUtils(): PluginImportUtils {
  if (!pluginImportUtils) {
    throw new Error('pluginImportUtils can only be used after Grafana instance has started.');
  }

  return pluginImportUtils;
}
