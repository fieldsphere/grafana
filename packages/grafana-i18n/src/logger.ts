/**
 * Lightweight structured logger for @grafana/i18n.
 *
 * This package cannot import `@grafana/data` (grafana-data depends on grafana-i18n).
 * Keep the payload shape aligned with `createStructuredLogger`: message + `{ source }`.
 */
const source = 'grafana/i18n';

export const logger = {
  warn: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.warn(message, { source }, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error(message, { source }, ...args);
  },
};
