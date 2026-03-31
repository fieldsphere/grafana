import { faro, LogContext, LogLevel } from '@grafana/faro-web-sdk';

import { config } from '../config';

export { LogLevel };

/** Arbitrary fields attached to a log line (normalized to string values for Faro). */
export type MonitoringLogFields = Record<string, unknown>;

function isDevelopmentEnv(): boolean {
  return config.buildInfo.env === 'development';
}

function normalizeLogContext(fields?: MonitoringLogFields): LogContext | undefined {
  if (!fields) {
    return undefined;
  }
  const out: LogContext = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === 'string') {
      out[key] = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      out[key] = String(value);
    } else {
      try {
        out[key] = JSON.stringify(value);
      } catch {
        out[key] = String(value);
      }
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function emitStructuredConsoleLine(level: string, message: string, fields?: MonitoringLogFields): void {
  if (!isDevelopmentEnv()) {
    return;
  }
  let line: string;
  try {
    line = JSON.stringify({
      level,
      message,
      timestamp: Date.now(),
      ...fields,
    });
  } catch {
    line = JSON.stringify({
      level,
      message,
      timestamp: Date.now(),
      contextNote: 'Could not serialize log fields',
    });
  }
  switch (level) {
    case 'DEBUG':
      // eslint-disable-next-line no-console
      console.debug(line);
      break;
    case 'INFO':
      // eslint-disable-next-line no-console
      console.info(line);
      break;
    case 'WARN':
      // eslint-disable-next-line no-console
      console.warn(line);
      break;
    case 'ERROR':
      // eslint-disable-next-line no-console
      console.error(line);
      break;
    default:
      // eslint-disable-next-line no-console
      console.info(line);
  }
}

function pushLogToFaro(level: LogLevel, message: string, contexts?: LogContext): void {
  if (!config.grafanaJavascriptAgent.enabled || typeof faro.api?.pushLog !== 'function') {
    return;
  }
  faro.api.pushLog([message], {
    level,
    context: contexts,
  });
}

/**
 * Log a message at INFO level
 * @public
 */
export function logInfo(message: string, fields?: MonitoringLogFields) {
  const contexts = normalizeLogContext(fields);
  pushLogToFaro(LogLevel.INFO, message, contexts);
  if (!config.grafanaJavascriptAgent.enabled) {
    emitStructuredConsoleLine('INFO', message, fields);
  }
}

/**
 * Log a message at WARNING level
 *
 * @public
 */
export function logWarning(message: string, fields?: MonitoringLogFields) {
  const contexts = normalizeLogContext(fields);
  pushLogToFaro(LogLevel.WARN, message, contexts);
  if (!config.grafanaJavascriptAgent.enabled) {
    emitStructuredConsoleLine('WARN', message, fields);
  }
}

/**
 * Log a message at DEBUG level
 *
 * @public
 */
export function logDebug(message: string, fields?: MonitoringLogFields) {
  const contexts = normalizeLogContext(fields);
  pushLogToFaro(LogLevel.DEBUG, message, contexts);
  if (!config.grafanaJavascriptAgent.enabled) {
    emitStructuredConsoleLine('DEBUG', message, fields);
  }
}

/**
 * Log an error
 *
 * @public
 */
export function logError(err: Error, fields?: MonitoringLogFields) {
  const contexts = normalizeLogContext({
    ...fields,
    name: err.name,
    stack: err.stack ?? '',
  });
  if (config.grafanaJavascriptAgent.enabled && typeof faro.api?.pushError === 'function') {
    faro.api.pushError(err, {
      context: contexts,
    });
  } else if (isDevelopmentEnv()) {
    emitStructuredConsoleLine('ERROR', err.message, {
      ...fields,
      name: err.name,
      stack: err.stack,
    });
  }
}

/**
 * Log a measurement
 *
 * @public
 */
export type MeasurementValues = Record<string, number>;
export function logMeasurement(type: string, values: MeasurementValues, fields?: MonitoringLogFields) {
  const faroContext = normalizeLogContext(fields);
  if (!config.grafanaJavascriptAgent.enabled || typeof faro.api?.pushMeasurement !== 'function') {
    if (isDevelopmentEnv()) {
      emitStructuredConsoleLine('INFO', `measurement:${type}`, { ...fields, type, values });
    }
    return;
  }
  faro.api.pushMeasurement(
    {
      type,
      values,
    },
    { context: faroContext }
  );
}

export interface MonitoringLogger {
  logDebug: (message: string, fields?: MonitoringLogFields) => void;
  logInfo: (message: string, fields?: MonitoringLogFields) => void;
  logWarning: (message: string, fields?: MonitoringLogFields) => void;
  logError: (error: Error, fields?: MonitoringLogFields) => void;
  logMeasurement: (type: string, measurement: MeasurementValues, fields?: MonitoringLogFields) => void;
}
/**
 * Creates a monitoring logger with five levels of logging methods: `logDebug`, `logInfo`, `logWarning`, `logError`, and `logMeasurement`.
 * These methods use `faro.api.pushX` web SDK methods to report these logs or errors to the Faro collector.
 *
 * @param {string} source - Identifier for the source of the log messages.
 * @param {MonitoringLogFields} [defaultContext] - Context to be included in every log message.
 *
 * @returns {MonitoringLogger} Logger object with five methods:
 * - `logDebug(message: string, fields?: MonitoringLogFields)`: Logs a debug message.
 * - `logInfo(message: string, fields?: MonitoringLogFields)`: Logs an informational message.
 * - `logWarning(message: string, fields?: MonitoringLogFields)`: Logs a warning message.
 * - `logError(error: Error, fields?: MonitoringLogFields)`: Logs an error message.
 * - `logMeasurement(measurement: Omit<MeasurementEvent, 'timestamp'>, fields?: MonitoringLogFields)`: Logs a measurement.
 * Each method combines the `defaultContext` (if provided), the `source`, and an optional `MonitoringLogFields` parameter into a full context that is included with the log message.
 */
export function createMonitoringLogger(source: string, defaultContext?: MonitoringLogFields): MonitoringLogger {
  const createFullContext = (fields?: MonitoringLogFields) => ({
    source: source,
    ...defaultContext,
    ...fields,
  });

  return {
    /**
     * Logs a debug message with optional additional context.
     * @param {string} message - The debug message to be logged.
     * @param {MonitoringLogFields} [fields] - Optional additional context to be included.
     */
    logDebug: (message: string, fields?: MonitoringLogFields) => logDebug(message, createFullContext(fields)),

    /**
     * Logs an informational message with optional additional context.
     * @param {string} message - The informational message to be logged.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logInfo: (message: string, fields?: MonitoringLogFields) => logInfo(message, createFullContext(fields)),

    /**
     * Logs a warning message with optional additional context.
     * @param {string} message - The warning message to be logged.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logWarning: (message: string, fields?: MonitoringLogFields) => logWarning(message, createFullContext(fields)),

    /**
     * Logs an error with optional additional context.
     * @param {Error} error - The error object to be logged.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logError: (error: Error, fields?: MonitoringLogFields) => logError(error, createFullContext(fields)),

    /**
     * Logs an measurement with optional additional context.
     * @param {MeasurementEvent} measurement - The measurement object to be recorded.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logMeasurement: (type: string, measurement: MeasurementValues, fields?: MonitoringLogFields) =>
      logMeasurement(type, measurement, createFullContext(fields)),
  };
}
