import { store } from '@grafana/data';
import { createStructuredLogger } from '@grafana/data';

const structuredLog = createStructuredLogger('public/app/core/utils/debugLog.ts');

/**
 * Creates a debug logger gated by a localStorage key.
 *
 * Enable in browser console:
 *   localStorage.setItem('grafana.debug.<key>', 'true')
 */
export function createDebugLog(key: string, prefix: string) {
  const storageKey = `grafana.debug.${key}`;

  return function debugLog(message: string, ...args: unknown[]) {
    if (store.get(storageKey) === 'true') {
      structuredLog.info(`[${prefix}] ${message}`, ...args);
    }
  };
}
