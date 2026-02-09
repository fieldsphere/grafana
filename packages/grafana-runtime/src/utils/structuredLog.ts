/**
 * Structured logging utility for Grafana
 *
 * Provides consistent, structured logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Structured context/metadata support
 * - JSON output in production for log aggregation
 * - Human-readable output in development
 * - Optional integration with Faro monitoring
 *
 * @packageDocumentation
 */

import { faro, LogLevel as FaroLogLevel } from '@grafana/faro-web-sdk';

import { config } from '../config';

/**
 * Log levels for structured logging
 * @public
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Context value type for structured logging
 * Accepts any JSON-serializable value
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LogContextValue = any;

/**
 * Context object for structured logging
 * @public
 */
export interface LogContext {
  [key: string]: LogContextValue;
}

/**
 * Structured log entry format
 * @public
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  logger: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Configuration options for the structured logger
 * @public
 */
export interface StructuredLoggerOptions {
  /** Minimum log level to output */
  minLevel?: LogLevel;
  /** Whether to output JSON format (default: true in production) */
  jsonOutput?: boolean;
  /** Whether to push logs to Faro when available */
  pushToFaro?: boolean;
  /** Default context to include in all log entries */
  defaultContext?: LogContext;
}

/**
 * Structured logger interface
 * @public
 */
export interface StructuredLogger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, error?: Error | unknown, context?: LogContext) => void;
  child: (childContext: LogContext) => StructuredLogger;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

const FARO_LOG_LEVEL_MAP: Record<LogLevel, FaroLogLevel> = {
  [LogLevel.DEBUG]: FaroLogLevel.DEBUG,
  [LogLevel.INFO]: FaroLogLevel.INFO,
  [LogLevel.WARN]: FaroLogLevel.WARN,
  [LogLevel.ERROR]: FaroLogLevel.ERROR,
};

/**
 * Determines if we're in a production environment
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Determines if we're in a test environment
 */
function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Formats a log entry for console output in development
 */
function formatForConsole(entry: LogEntry): string {
  const levelColors: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: '\x1b[36m', // cyan
    [LogLevel.INFO]: '\x1b[32m', // green
    [LogLevel.WARN]: '\x1b[33m', // yellow
    [LogLevel.ERROR]: '\x1b[31m', // red
  };
  const reset = '\x1b[0m';
  const color = levelColors[entry.level];

  let output = `${color}[${entry.level.toUpperCase()}]${reset} [${entry.logger}] ${entry.message}`;

  if (entry.context && Object.keys(entry.context).length > 0) {
    output += ` ${JSON.stringify(entry.context)}`;
  }

  if (entry.error) {
    output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
    if (entry.error.stack) {
      output += `\n  ${entry.error.stack}`;
    }
  }

  return output;
}

/**
 * Outputs the log entry to the appropriate console method
 */
function outputToConsole(entry: LogEntry, jsonOutput: boolean): void {
  const consoleMethod = {
    [LogLevel.DEBUG]: console.debug,
    [LogLevel.INFO]: console.info,
    [LogLevel.WARN]: console.warn,
    [LogLevel.ERROR]: console.error,
  }[entry.level];

  if (jsonOutput) {
    consoleMethod(JSON.stringify(entry));
  } else {
    consoleMethod(formatForConsole(entry));
  }
}

/**
 * Converts a value to a string for Faro context.
 * Faro's LogContext expects Record<string, string>.
 */
function toFaroString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * Pushes log entry to Faro monitoring if enabled
 */
function pushToFaro(entry: LogEntry): void {
  if (!config.grafanaJavascriptAgent?.enabled) {
    return;
  }

  try {
    // Convert all context values to strings for Faro compatibility
    const faroContext: Record<string, string> = {
      logger: entry.logger,
    };
    if (entry.context) {
      for (const [key, value] of Object.entries(entry.context)) {
        faroContext[key] = toFaroString(value);
      }
    }

    if (entry.level === LogLevel.ERROR && entry.error) {
      const error = new Error(entry.error.message);
      error.name = entry.error.name;
      if (entry.error.stack) {
        error.stack = entry.error.stack;
      }
      faro.api.pushError(error, { context: faroContext });
    } else {
      faro.api.pushLog([entry.message], {
        level: FARO_LOG_LEVEL_MAP[entry.level],
        context: faroContext,
      });
    }
  } catch {
    // Silently ignore Faro errors to prevent logging loops
  }
}

/**
 * Normalizes an error to a consistent format
 */
function normalizeError(error: Error | unknown): { name: string; message: string; stack?: string } | undefined {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
    };
  }

  return {
    name: 'Error',
    message: String(error),
  };
}

/**
 * Creates a structured logger instance
 *
 * @param name - The logger name/source identifier
 * @param options - Configuration options for the logger
 * @returns A structured logger instance
 *
 * @example
 * ```typescript
 * const logger = createStructuredLogger('MyComponent');
 *
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Failed to fetch data', error, { endpoint: '/api/users' });
 *
 * // Create a child logger with additional context
 * const childLogger = logger.child({ requestId: 'abc-123' });
 * childLogger.info('Processing request');
 * ```
 *
 * @public
 */
export function createStructuredLogger(name: string, options: StructuredLoggerOptions = {}): StructuredLogger {
  const {
    minLevel = isProduction() ? LogLevel.INFO : LogLevel.DEBUG,
    jsonOutput = isProduction(),
    pushToFaro: shouldPushToFaro = true,
    defaultContext = {},
  } = options;

  const shouldLog = (level: LogLevel): boolean => {
    // Don't log in test environment by default
    if (isTest()) {
      return false;
    }
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
  };

  const log = (level: LogLevel, message: string, context?: LogContext, error?: Error | unknown): void => {
    if (!shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      logger: name,
      message,
      context: { ...defaultContext, ...context },
      error: normalizeError(error),
    };

    // Clean up empty context
    if (entry.context && Object.keys(entry.context).length === 0) {
      delete entry.context;
    }

    outputToConsole(entry, jsonOutput);

    if (shouldPushToFaro) {
      pushToFaro(entry);
    }
  };

  const logger: StructuredLogger = {
    debug: (message: string, context?: LogContext) => log(LogLevel.DEBUG, message, context),
    info: (message: string, context?: LogContext) => log(LogLevel.INFO, message, context),
    warn: (message: string, context?: LogContext) => log(LogLevel.WARN, message, context),
    error: (message: string, error?: Error | unknown, context?: LogContext) =>
      log(LogLevel.ERROR, message, context, error),
    child: (childContext: LogContext): StructuredLogger => {
      return createStructuredLogger(name, {
        minLevel,
        jsonOutput,
        pushToFaro: shouldPushToFaro,
        defaultContext: { ...defaultContext, ...childContext },
      });
    },
  };

  return logger;
}

// Default application logger
let defaultLogger: StructuredLogger | null = null;

/**
 * Gets the default application logger
 * @public
 */
export function getLogger(): StructuredLogger {
  if (!defaultLogger) {
    defaultLogger = createStructuredLogger('grafana');
  }
  return defaultLogger;
}

/**
 * Convenience function to log a debug message
 * @public
 */
export function debug(message: string, context?: LogContext): void {
  getLogger().debug(message, context);
}

/**
 * Convenience function to log an info message
 * @public
 */
export function info(message: string, context?: LogContext): void {
  getLogger().info(message, context);
}

/**
 * Convenience function to log a warning message
 * @public
 */
export function warn(message: string, context?: LogContext): void {
  getLogger().warn(message, context);
}

/**
 * Convenience function to log an error message
 * @public
 */
export function error(message: string, err?: Error | unknown, context?: LogContext): void {
  getLogger().error(message, err, context);
}
