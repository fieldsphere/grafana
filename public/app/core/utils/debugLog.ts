import { store, createStructuredLogger } from '@grafana/data';

/**
 * Creates a debug logger gated by a localStorage key.
 *
 * Enable in browser console:
 *   localStorage.setItem('grafana.debug.<key>', 'true')
 */
const logger = createStructuredLogger('features.core');

export function createDebugLog(key: string, prefix: string) {
  const storageKey = `grafana.debug.${key}`;

  return function debugLog(message: string, ...args: unknown[]) {
    if (store.get(storageKey) === 'true') {
      logger.info(`[${prefix}] ${message}`, ...args);
    }
  };
}
