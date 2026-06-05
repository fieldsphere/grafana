import { createStructuredLogger, type PluginType } from '@grafana/data';

import { createMonitoringLogger, type MonitoringLogger } from '../../utils/logging';

const structuredLogger = createStructuredLogger('packages/grafana-runtime/src/services/pluginMeta/logging.ts');

let logger: MonitoringLogger;

function getLogger() {
  if (!logger) {
    logger = createMonitoringLogger('pluginMeta-logs');
  }

  return logger;
}

export function logPluginMetaWarning(message: string, type: PluginType): void {
  getLogger().logWarning(message, { type });
  structuredLogger.warn(message);
}

export function logPluginMetaError(message: string, error: unknown): void {
  getLogger().logError(new Error(message, { cause: error }));
  structuredLogger.error(message, error);
}

export function setPluginMetaLogger(override: MonitoringLogger) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('setLogger function can only be called from tests.');
  }

  logger = override;
}
