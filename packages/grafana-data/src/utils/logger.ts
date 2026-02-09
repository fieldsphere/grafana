/**
 * Simple internal logger for @grafana/data package.
 *
 * This provides basic console-based logging without external dependencies
 * to avoid circular dependency issues with @grafana/runtime.
 *
 * @internal
 */

export interface InternalLogger {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) => void;
}

/**
 * Creates a simple console-based logger for internal use.
 * This avoids circular dependencies with @grafana/runtime.
 *
 * @param name - The logger name/source identifier
 * @returns A simple logger instance
 *
 * @internal
 */
export function createInternalLogger(name: string): InternalLogger {
  const formatMessage = (level: string, message: string, context?: Record<string, unknown>): string => {
    let output = `[${level.toUpperCase()}] [${name}] ${message}`;
    if (context && Object.keys(context).length > 0) {
      output += ` ${JSON.stringify(context)}`;
    }
    return output;
  };

  return {
    debug: (message: string, context?: Record<string, unknown>) => {
      if (process.env.NODE_ENV !== 'test') {
        console.debug(formatMessage('debug', message, context));
      }
    },
    info: (message: string, context?: Record<string, unknown>) => {
      if (process.env.NODE_ENV !== 'test') {
        console.info(formatMessage('info', message, context));
      }
    },
    warn: (message: string, context?: Record<string, unknown>) => {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(formatMessage('warn', message, context));
      }
    },
    error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) => {
      if (process.env.NODE_ENV !== 'test') {
        const errorInfo =
          error instanceof Error ? { errorName: error.name, errorMessage: error.message } : error ? { error } : {};
        console.error(formatMessage('error', message, { ...errorInfo, ...context }));
      }
    },
  };
}
