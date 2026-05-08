import { structuredLog, toLogContextPart } from '@grafana/data';
import { faro, type LogContext, LogLevel } from '@grafana/faro-web-sdk';

import { config } from '../config';

export { LogLevel };

function contextsAsRecord(contexts?: LogContext): Record<string, unknown> | undefined {
  return contexts !== undefined ? (contexts as Record<string, unknown>) : undefined;
}

export type MeasurementValues = Record<string, number>;

/**
 * Log a message at INFO level
 * @public
 */
export function logInfo(message: string, contexts?: LogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushLog([message], {
      level: LogLevel.INFO,
      context: contexts,
    });
    return;
  }
  structuredLog('info', message, contextsAsRecord(contexts));
}

/**
 * Log a message at WARNING level
 *
 * @public
 */
export function logWarning(message: string, contexts?: LogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushLog([message], {
      level: LogLevel.WARN,
      context: contexts,
    });
    return;
  }
  structuredLog('warn', message, contextsAsRecord(contexts));
}

/**
 * Log a message at DEBUG level
 *
 * @public
 */
export function logDebug(message: string, contexts?: LogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushLog([message], {
      level: LogLevel.DEBUG,
      context: contexts,
    });
    return;
  }
  structuredLog('debug', message, contextsAsRecord(contexts));
}

/**
 * Log an error
 *
 * @public
 */
export function logError(err: Error, contexts?: LogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushError(err, {
      context: contexts,
    });
    return;
  }
  structuredLog('error', err.message, {
    ...contextsAsRecord(contexts),
    error: toLogContextPart(err),
  });
}

/**
 * Log a measurement
 *
 * @public
 */
export function logMeasurement(type: string, values: MeasurementValues, context?: LogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushMeasurement(
      {
        type,
        values,
      },
      { context: context }
    );
    return;
  }
  structuredLog('info', `measurement.${type}`, { ...contextsAsRecord(context), metrics: values });
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
