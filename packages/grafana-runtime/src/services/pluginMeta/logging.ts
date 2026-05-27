import { type PluginType } from '@grafana/data';

import { createMonitoringLogger, type MonitoringLogger } from '../../utils/logging';
import { structuredConsoleLog } from '../../utils/structuredConsole';

let logger: MonitoringLogger;

function getLogger() {
  if (!logger) {
    logger = createMonitoringLogger('pluginMeta-logs');
  }

  return logger;
}

export function logPluginMetaWarning(message: string, type: PluginType): void {
  getLogger().logWarning(message, { type });
  structuredConsoleLog('warn', message, { source: 'pluginMeta', type });
}

export function logPluginMetaError(message: string, error: unknown): void {
  getLogger().logError(new Error(message, { cause: error }));
  structuredConsoleLog('error', message, { source: 'pluginMeta', error });
}

export function setPluginMetaLogger(override: MonitoringLogger) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('setLogger function can only be called from tests.');
  }

  logger = override;
}
