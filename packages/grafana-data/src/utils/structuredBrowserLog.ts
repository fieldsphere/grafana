/**
 * Browser-only structured logging: emits a single record object to the console
 * so messages are grep-friendly and observable. Used when Faro / GJA is disabled
 * and from packages that cannot depend on `@grafana/runtime`.
 *
 * @public
 */
export type StructuredLogRecord = {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  error?: { name: string; message: string; stack?: string };
  timestamp: string;
};

const GRAFANA_LOG_PREFIX = '[Grafana]';

function timestamp(): string {
  return new Date().toISOString();
}

/**
 * Writes a structured log record using console.info / console.warn / console.error.
 *
 * @public
 */
export function emitStructuredBrowserLog(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>
): void {
  const record: StructuredLogRecord = { level, message, ...(context !== undefined ? { context } : {}), timestamp: timestamp() };
  if (level === 'error') {
    console.error(GRAFANA_LOG_PREFIX, record);
  } else if (level === 'warn') {
    console.warn(GRAFANA_LOG_PREFIX, record);
  } else {
    console.info(GRAFANA_LOG_PREFIX, record);
  }
}

/**
 * Writes an error record with message, optional context, and error metadata.
 *
 * @public
 */
export function emitStructuredBrowserError(error: Error, context?: Record<string, unknown>): void {
  const record: StructuredLogRecord = {
    level: 'error',
    message: error.message,
    ...(context !== undefined ? { context } : {}),
    error: { name: error.name, message: error.message, stack: error.stack },
    timestamp: timestamp(),
  };
  console.error(GRAFANA_LOG_PREFIX, record);
}
