import { store } from '@grafana/data';

import { grafanaStructuredLogger } from '@grafana/runtime';
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
      grafanaStructuredLogger.logInfo(`[${prefix}] ${message}`, args.length ? { parts: args } : undefined);
    }
  };
}
