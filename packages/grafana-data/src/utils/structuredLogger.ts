/**
 * Structured logger for packages that output to console.
 * Outputs JSON-formatted log entries for consistent, parseable logging.
 * When running in Grafana app, the app's createMonitoringLogger from @grafana/runtime
 * is preferred for integration with observability backends.
 *
 * @internal
 */
export interface StructuredLogger {
  logInfo: (message: string, context?: Record<string, unknown>) => void;
  logWarning: (message: string, context?: Record<string, unknown>) => void;
  logError: (message: string, context?: Record<string, unknown>) => void;
  logErrorFromError: (error: Error, context?: Record<string, unknown>) => void;
}

function formatEntry(level: string, message: string, context?: Record<string, unknown>): string {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  });
}

export function createStructuredLogger(source: string): StructuredLogger {
  return {
    logInfo: (message: string, context?: Record<string, unknown>) => {
      console.log(formatEntry('info', message, { source, ...context }));
    },
    logWarning: (message: string, context?: Record<string, unknown>) => {
      console.warn(formatEntry('warn', message, { source, ...context }));
    },
    logError: (message: string, context?: Record<string, unknown>) => {
      console.error(formatEntry('error', message, { source, ...context }));
    },
    logErrorFromError: (error: Error, context?: Record<string, unknown>) => {
      console.error(
        formatEntry('error', error.message, {
          source,
          stack: error.stack,
          ...context,
        })
      );
    },
  };
}
