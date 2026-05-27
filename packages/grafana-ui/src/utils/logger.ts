import { throttle } from 'lodash';

import { emitStructuredBrowserLog } from '@grafana/data';

type Args = Parameters<typeof console.log>;

/**
 * @internal
 * */
const throttledLog = throttle((name: string, id: string, ...t: Args) => {
  emitStructuredBrowserLog('info', `[${name}: ${id}]`, { parts: t });
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
      if (throttle) {
        throttledLog(name, id, ...t);
        return;
      }
      emitStructuredBrowserLog('info', `[${name}: ${id}]`, { parts: t });
    },
    enable: () => (loggingEnabled = true),
    disable: () => (loggingEnabled = false),
    isEnabled: () => loggingEnabled,
  };
};
