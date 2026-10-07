/**
 * Structured logger for @grafana/i18n.
 *
 * This package cannot import `@grafana/data` (grafana-data depends on grafana-i18n),
 * so it cannot share `createStructuredLogger`. The console payload matches that logger's
 * local sink: message, then `{ source }`.
 */
const source = 'grafana/i18n';

export const logger = {
  warn: (message: string, ...args: unknown[]) => {
    console.warn(message, { source }, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(message, { source }, ...args);
  },
};
