import { createMonitoringLogger } from '@grafana/runtime';

export type LogContext = Record<string, string>;

export interface StructuredLogger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (error: Error | string, context?: LogContext) => void;
}

/**
 * Creates a structured logger for a specific feature/module.
 * Logs are sent to the monitoring system when enabled, with console fallback for development.
 *
 * @param source - Identifier for the source module (e.g., 'features.dashboard', 'core.auth')
 * @param defaultContext - Default context to include in all log messages
 */
export function createStructuredLogger(source: string, defaultContext?: LogContext): StructuredLogger {
  const monitoringLogger = createMonitoringLogger(source, defaultContext);

  return {
    debug: (message: string, context?: LogContext) => {
      monitoringLogger.logDebug(message, context);
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[${source}] ${message}`, context ?? '');
      }
    },
    info: (message: string, context?: LogContext) => {
      monitoringLogger.logInfo(message, context);
      if (process.env.NODE_ENV !== 'production') {
        console.info(`[${source}] ${message}`, context ?? '');
      }
    },
    warn: (message: string, context?: LogContext) => {
      monitoringLogger.logWarning(message, context);
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[${source}] ${message}`, context ?? '');
      }
    },
    error: (error: Error | string, context?: LogContext) => {
      const err = typeof error === 'string' ? new Error(error) : error;
      monitoringLogger.logError(err, context);
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[${source}]`, err, context ?? '');
      }
    },
  };
}

// Pre-configured loggers for common modules
export const dashboardLogger = createStructuredLogger('features.dashboard');
export const alertingLogger = createStructuredLogger('features.alerting');
export const coreLogger = createStructuredLogger('core');
export const pluginsLogger = createStructuredLogger('features.plugins');
export const exploreLogger = createStructuredLogger('features.explore');
export const queryLogger = createStructuredLogger('features.query');
