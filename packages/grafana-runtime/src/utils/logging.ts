import { emitStructuredBrowserError, emitStructuredBrowserLog } from '@grafana/data';
import { faro, type LogContext, LogLevel } from '@grafana/faro-web-sdk';

import { config } from '../config';

/** Context attached to frontend logs/errors. Values are normalized to strings for Faro. */
export type GrafanaStructuredLogContext = Record<string, unknown>;

function stringifyContextValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'symbol') {
    return value.toString();
  }
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

function toFaroContext(contexts?: GrafanaStructuredLogContext): LogContext | undefined {
  if (!contexts) {
    return undefined;
  }
  const entries = Object.entries(contexts).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    return undefined;
  }
  const out: LogContext = {};
  for (const [key, value] of entries) {
    out[key] = stringifyContextValue(value);
  }
  return out;
}

function mergeStructuredContext(
  source: string,
  ...parts: Array<GrafanaStructuredLogContext | undefined>
): GrafanaStructuredLogContext {
  let merged: GrafanaStructuredLogContext = { source };
  for (const part of parts) {
    if (part !== undefined) {
      merged = { ...merged, ...part };
    }
  }
  return merged;
}

export { LogLevel };

/**
 * Log a message at INFO level
 * @public
 */
export function logInfo(message: string, contexts?: GrafanaStructuredLogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushLog([message], {
      level: LogLevel.INFO,
      context: toFaroContext(contexts),
    });
    return;
  }
  emitStructuredBrowserLog('info', message, contexts);
}

/**
 * Log a message at WARNING level
 *
 * @public
 */
export function logWarning(message: string, contexts?: GrafanaStructuredLogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushLog([message], {
      level: LogLevel.WARN,
      context: toFaroContext(contexts),
    });
    return;
  }
  emitStructuredBrowserLog('warn', message, contexts);
}

/**
 * Log a message at DEBUG level
 *
 * @public
 */
export function logDebug(message: string, contexts?: GrafanaStructuredLogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushLog([message], {
      level: LogLevel.DEBUG,
      context: toFaroContext(contexts),
    });
    return;
  }
  emitStructuredBrowserLog('debug', message, contexts);
}

/**
 * Log an error
 *
 * @public
 */
export function logError(err: Error, contexts?: GrafanaStructuredLogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushError(err, {
      context: toFaroContext(contexts),
    });
    return;
  }
  emitStructuredBrowserError(err, contexts);
}

/**
 * Log a measurement
 *
 * @public
 */
export type MeasurementValues = Record<string, number>;
export function logMeasurement(type: string, values: MeasurementValues, context?: GrafanaStructuredLogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushMeasurement(
      {
        type,
        values,
      },
      { context: toFaroContext(context) }
    );
    return;
  }
  emitStructuredBrowserLog('info', 'measurement', { ...(context ?? {}), measurementType: type, values });
}

export interface MonitoringLogger {
  logDebug: (message: string, contexts?: GrafanaStructuredLogContext) => void;
  logInfo: (message: string, contexts?: GrafanaStructuredLogContext) => void;
  logWarning: (message: string, contexts?: GrafanaStructuredLogContext) => void;
  logError: (error: Error, contexts?: GrafanaStructuredLogContext) => void;
  logMeasurement: (type: string, measurement: MeasurementValues, contexts?: GrafanaStructuredLogContext) => void;
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
export function createMonitoringLogger(source: string, defaultContext?: GrafanaStructuredLogContext): MonitoringLogger {
  const createFullContext = (contexts?: GrafanaStructuredLogContext): GrafanaStructuredLogContext =>
    mergeStructuredContext(source, defaultContext, contexts);

  return {
    /**
     * Logs a debug message with optional additional context.
     * @param {string} message - The debug message to be logged.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logDebug: (message: string, contexts?: GrafanaStructuredLogContext) => logDebug(message, createFullContext(contexts)),

    /**
     * Logs an informational message with optional additional context.
     * @param {string} message - The informational message to be logged.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logInfo: (message: string, contexts?: GrafanaStructuredLogContext) => logInfo(message, createFullContext(contexts)),

    /**
     * Logs a warning message with optional additional context.
     * @param {string} message - The warning message to be logged.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logWarning: (message: string, contexts?: GrafanaStructuredLogContext) => logWarning(message, createFullContext(contexts)),

    /**
     * Logs an error with optional additional context.
     * @param {Error} error - The error object to be logged.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logError: (error: Error, contexts?: GrafanaStructuredLogContext) =>
      logError(error, createFullContext(contexts)),

    /**
     * Logs an measurement with optional additional context.
     * @param {MeasurementEvent} measurement - The measurement object to be recorded.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logMeasurement: (type: string, measurement: MeasurementValues, contexts?: GrafanaStructuredLogContext) =>
      logMeasurement(type, measurement, createFullContext(contexts)),
  };
}

/** Default frontend logger when a feature-local logger is unnecessary. */
export const grafanaStructuredLogger = createMonitoringLogger('grafana.frontend');
