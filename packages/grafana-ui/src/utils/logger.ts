import { throttle } from 'lodash';

import { logDebug } from '@grafana/runtime';

type Args = Parameters<typeof console.log>;

/**
 * @internal
 * */
const throttledLog = throttle((message: string, contexts?: { additionalArgs?: unknown[] }) => {
  logDebug(message, contexts);
}, 500);

/**
 * @internal
 */
export interface Logger {
  logger: (...t: Args) => void;
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
}

/** @internal */
export const createLogger = (name: string): Logger => {
  let loggingEnabled = false;

  if (typeof window !== 'undefined') {
    loggingEnabled = window.localStorage.getItem('grafana.debug') === 'true';
  }

  return {
    logger: (id: string, throttle = false, ...t: Args) => {
      if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' || !loggingEnabled) {
        return;
      }
      const message = `[${name}: ${id}]: ${String(t[0] ?? '')}`;
      const contexts = t.length > 1 ? { additionalArgs: t.slice(1) } : undefined;
      if (throttle) {
        throttledLog(message, contexts);
      } else {
        logDebug(message, contexts);
      }
    },
    enable: () => (loggingEnabled = true),
    disable: () => (loggingEnabled = false),
    isEnabled: () => loggingEnabled,
  };
};
