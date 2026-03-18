import { faro, LogContext, LogLevel } from '@grafana/faro-web-sdk';

import { config } from '../config';

export { LogLevel };

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
  }
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
  }
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
  }
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
  }
}

/**
 * Log a measurement
 *
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
  }
}

export interface MonitoringLogger {
  logDebug: (message: string, contexts?: LogContext) => void;
  logInfo: (message: string, contexts?: LogContext) => void;
  logWarning: (message: string, contexts?: LogContext) => void;
  logError: (error: Error, contexts?: LogContext) => void;
  logMeasurement: (type: string, measurement: MeasurementValues, contexts?: LogContext) => void;
}

const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug', 'trace'] as const;
type ConsoleMethod = (typeof CONSOLE_METHODS)[number];
type ConsoleMethodImplementation = (...data: unknown[]) => void;

const originalConsoleMethods: Partial<Record<ConsoleMethod, ConsoleMethodImplementation>> = {};

let isConsoleBridgeInstalled = false;
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

function formatConsoleMessage(method: ConsoleMethod, args: unknown[]): string {
  if (args.length === 0) {
    return `console.${method} called`;
  }

  return args
    .map((value) => {
      if (value instanceof Error) {
        return value.message;
      }

      if (typeof value === 'string') {
        return value;
      }

      if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
        return String(value);
      }

      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    })
    .join(' ');
}

function normalizeConsoleArg(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  return value;
}

function getErrorArg(args: unknown[]): Error | undefined {
  const firstError = args.find((arg): arg is Error => arg instanceof Error);
  return firstError;
}

/**
 * Bridges browser `console.*` calls to structured monitoring logs.
 *
 * This allows existing console callsites to emit structured logs without
 * requiring immediate per-file migrations.
 *
 * @public
 */
export function installConsoleStructuredLogging(source = 'browser.console') {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'test' || isConsoleBridgeInstalled) {
    return;
  }

  const browserConsole = window.console;
  const logger = createMonitoringLogger(source);

  for (const method of CONSOLE_METHODS) {
    const originalMethod = browserConsole[method];
    const original: ConsoleMethodImplementation = (...data: unknown[]) => {
      Reflect.apply(originalMethod, browserConsole, data);
    };
    originalConsoleMethods[method] = original;

    Reflect.set(browserConsole, method, (...args: unknown[]) => {
      const message = formatConsoleMessage(method, args);
      const context: LogContext = {
        method,
        args: args.map(normalizeConsoleArg),
      };

      if (method === 'error') {
        logger.logError(getErrorArg(args) ?? new Error(message), context);
      } else if (method === 'warn') {
        logger.logWarning(message, context);
      } else if (method === 'debug' || method === 'trace') {
        logger.logDebug(message, context);
      } else {
        logger.logInfo(message, context);
      }

      original(...args);
    });
  }

  isConsoleBridgeInstalled = true;
}

/**
 * Restores original browser `console.*` methods after `installConsoleStructuredLogging`.
 *
 * @public
 */
export function uninstallConsoleStructuredLogging() {
  if (typeof window === 'undefined' || !isConsoleBridgeInstalled) {
    return;
  }

  const browserConsole = window.console;

  for (const method of CONSOLE_METHODS) {
    const original = originalConsoleMethods[method];
    if (original) {
      Reflect.set(browserConsole, method, original);
      delete originalConsoleMethods[method];
    }
  }

  isConsoleBridgeInstalled = false;
}
