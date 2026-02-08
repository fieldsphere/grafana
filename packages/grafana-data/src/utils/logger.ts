/**
 * Simple structured logger for @grafana/data package
 * This logger provides console output with structured formatting for development
 * and can be silenced in production or test environments.
 *
 * @internal
 */

/**
 * Log context type for structured logging
 */
export interface DataLogContext {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Check if we're in development mode
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
}

/**
 * Format context for console output
 */
function formatContext(source: string, contexts?: DataLogContext): string {
  const ctx = contexts ? ` ${JSON.stringify(contexts)}` : '';
  return `[${source}]${ctx}`;
}

/**
 * Log a debug message
 * Only outputs in development mode
 */
export function logDebug(source: string, message: string, contexts?: DataLogContext): void {
  if (isDevelopment()) {
    // eslint-disable-next-line no-console
    console.debug(`${formatContext(source, contexts)} ${message}`);
  }
}

/**
 * Log an info message
 * Only outputs in development mode
 */
export function logInfo(source: string, message: string, contexts?: DataLogContext): void {
  if (isDevelopment()) {
    // eslint-disable-next-line no-console
    console.info(`${formatContext(source, contexts)} ${message}`);
  }
}

/**
 * Log a warning message
 * Outputs in all environments as warnings should be visible
 */
export function logWarning(source: string, message: string, contexts?: DataLogContext): void {
  // eslint-disable-next-line no-console
  console.warn(`${formatContext(source, contexts)} ${message}`);
}

/**
 * Log an error message
 * Outputs in all environments as errors should be visible
 */
export function logError(source: string, message: string, error?: Error, contexts?: DataLogContext): void {
  // eslint-disable-next-line no-console
  console.error(`${formatContext(source, contexts)} ${message}`, error ?? '');
}

/**
 * Creates a logger instance for a specific source/module
 */
export interface DataLogger {
  debug: (message: string, contexts?: DataLogContext) => void;
  info: (message: string, contexts?: DataLogContext) => void;
  warn: (message: string, contexts?: DataLogContext) => void;
  error: (message: string, error?: Error, contexts?: DataLogContext) => void;
}

/**
 * Create a logger instance for a specific source
 *
 * @param source - The source identifier (e.g., 'grafana-data.utils.store')
 * @returns A logger instance with debug, info, warn, and error methods
 *
 * @example
 * ```ts
 * const logger = createDataLogger('grafana-data.utils.store');
 * logger.warn('Failed to parse stored value', { key: 'myKey' });
 * ```
 */
export function createDataLogger(source: string): DataLogger {
  return {
    debug: (message: string, contexts?: DataLogContext) => logDebug(source, message, contexts),
    info: (message: string, contexts?: DataLogContext) => logInfo(source, message, contexts),
    warn: (message: string, contexts?: DataLogContext) => logWarning(source, message, contexts),
    error: (message: string, error?: Error, contexts?: DataLogContext) => logError(source, message, error, contexts),
  };
}
