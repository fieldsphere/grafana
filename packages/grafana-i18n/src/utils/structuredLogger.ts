/**
 * Structured logger for @grafana/i18n package.
 * Outputs JSON-formatted log entries for consistent, parseable logging.
 *
 * @internal
 */
function formatEntry(level: string, message: string, context?: Record<string, unknown>): string {
  return JSON.stringify({
    level,
    source: 'grafana-i18n',
    message,
    timestamp: new Date().toISOString(),
    ...context,
  });
}

export const i18nLogger = {
  logError: (message: string, context?: Record<string, unknown>) => {
    console.error(formatEntry('error', message, context));
  },
  logWarning: (message: string, context?: Record<string, unknown>) => {
    console.warn(formatEntry('warn', message, context));
  },
};
