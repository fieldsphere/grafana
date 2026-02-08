import { faro, LogContext, LogLevel } from '@grafana/faro-web-sdk';

import { config } from '../config';

export { LogLevel };

/**
 * Structured log context type - can contain any string key-value pairs
 * @public
 */
export type { LogContext };

/**
 * Check if we're in development mode
 * @internal
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Check if console logging is enabled in development
 * @internal
 */
function isDevLoggingEnabled(): boolean {
  if (typeof window !== 'undefined') {
    return window.localStorage?.getItem('grafana.debug') === 'true' || isDevelopment();
  }
  return isDevelopment();
}

/**
 * Format context for console output
 * @internal
 */
function formatContext(contexts?: LogContext): string {
  if (!contexts || Object.keys(contexts).length === 0) {
    return '';
  }
  return ` ${JSON.stringify(contexts)}`;
}

/**
 * Log a message at INFO level
 * Logs to Faro in production, and to console in development
 * @public
 */
export function logInfo(message: string, contexts?: LogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushLog([message], {
      level: LogLevel.INFO,
      context: contexts,
    });
  } else if (isDevLoggingEnabled()) {
    // eslint-disable-next-line no-console
    console.info(`[INFO]${formatContext(contexts)} ${message}`);
  }
}

/**
 * Log a message at WARNING level
 * Logs to Faro in production, and to console in development
 * @public
 */
export function logWarning(message: string, contexts?: LogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushLog([message], {
      level: LogLevel.WARN,
      context: contexts,
    });
  } else if (isDevLoggingEnabled()) {
    // eslint-disable-next-line no-console
    console.warn(`[WARN]${formatContext(contexts)} ${message}`);
  }
}

/**
 * Log a message at DEBUG level
 * Logs to Faro in production, and to console in development
 * @public
 */
export function logDebug(message: string, contexts?: LogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushLog([message], {
      level: LogLevel.DEBUG,
      context: contexts,
    });
  } else if (isDevLoggingEnabled()) {
    // eslint-disable-next-line no-console
    console.debug(`[DEBUG]${formatContext(contexts)} ${message}`);
  }
}

/**
 * Log an error
 * Logs to Faro in production, and to console in development
 * @public
 */
export function logError(err: Error, contexts?: LogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushError(err, {
      context: contexts,
    });
  } else if (isDevLoggingEnabled()) {
    // eslint-disable-next-line no-console
    console.error(`[ERROR]${formatContext(contexts)}`, err);
  }
}

/**
 * Log a measurement
 * Logs to Faro in production, and to console in development
 * @public
 */
export type MeasurementValues = Record<string, number>;
export function logMeasurement(type: string, values: MeasurementValues, context?: LogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushMeasurement(
      {
        type,
        values,
      },
      { context: context }
    );
  } else if (isDevLoggingEnabled()) {
    // eslint-disable-next-line no-console
    console.info(`[MEASUREMENT] ${type}${formatContext(context)}`, values);
  }
}

export interface MonitoringLogger {
  logDebug: (message: string, contexts?: LogContext) => void;
  logInfo: (message: string, contexts?: LogContext) => void;
  logWarning: (message: string, contexts?: LogContext) => void;
  logError: (error: Error, contexts?: LogContext) => void;
  logMeasurement: (type: string, measurement: MeasurementValues, contexts?: LogContext) => void;
}
/**
 * Creates a monitoring logger with five levels of logging methods: `logDebug`, `logInfo`, `logWarning`, `logError`, and `logMeasurement`.
 * These methods use `faro.api.pushX` web SDK methods to report these logs or errors to the Faro collector.
 * In development mode (when Faro is not enabled), logs are output to the console with structured formatting.
 *
 * @param {string} source - Identifier for the source of the log messages.
 * @param {LogContext} [defaultContext] - Context to be included in every log message.
 *
 * @returns {MonitoringLogger} Logger object with five methods:
 * - `logDebug(message: string, contexts?: LogContext)`: Logs a debug message.
 * - `logInfo(message: string, contexts?: LogContext)`: Logs an informational message.
 * - `logWarning(message: string, contexts?: LogContext)`: Logs a warning message.
 * - `logError(error: Error, contexts?: LogContext)`: Logs an error message.
 * - `logMeasurement(measurement: Omit<MeasurementEvent, 'timestamp'>, contexts?: LogContext)`: Logs a measurement.
 * Each method combines the `defaultContext` (if provided), the `source`, and an optional `LogContext` parameter into a full context that is included with the log message.
 */
export function createMonitoringLogger(source: string, defaultContext?: LogContext): MonitoringLogger {
  const createFullContext = (contexts?: LogContext) => ({
    source: source,
    ...defaultContext,
    ...contexts,
  });

  return {
    /**
     * Logs a debug message with optional additional context.
     * @param {string} message - The debug message to be logged.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logDebug: (message: string, contexts?: LogContext) => logDebug(message, createFullContext(contexts)),

    /**
     * Logs an informational message with optional additional context.
     * @param {string} message - The informational message to be logged.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logInfo: (message: string, contexts?: LogContext) => logInfo(message, createFullContext(contexts)),

    /**
     * Logs a warning message with optional additional context.
     * @param {string} message - The warning message to be logged.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logWarning: (message: string, contexts?: LogContext) => logWarning(message, createFullContext(contexts)),

    /**
     * Logs an error with optional additional context.
     * @param {Error} error - The error object to be logged.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logError: (error: Error, contexts?: LogContext) => logError(error, createFullContext(contexts)),

    /**
     * Logs an measurement with optional additional context.
     * @param {MeasurementEvent} measurement - The measurement object to be recorded.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logMeasurement: (type: string, measurement: MeasurementValues, contexts?: LogContext) =>
      logMeasurement(type, measurement, createFullContext(contexts)),
  };
}
