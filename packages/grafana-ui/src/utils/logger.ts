import { throttle } from 'lodash';

import { createStructuredLogger, store } from '@grafana/data';

type Args = Parameters<typeof console.log>;

const structuredLogger = createStructuredLogger('grafana/ui', { remote: false });

/**
 * @internal
 * */
const throttledLog = throttle((...t: Args) => {
  structuredLogger.info(...t);
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
    loggingEnabled = store.get('grafana.debug') === 'true';
  }

  return {
    logger: (id: string, throttle = false, ...t: Args) => {
      if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' || !loggingEnabled) {
        return;
      }
      const emit = throttle ? throttledLog : (...args: Args) => structuredLogger.info(...args);
      emit(`[${name}: ${id}]:`, ...t);
    },
    enable: () => (loggingEnabled = true),
    disable: () => (loggingEnabled = false),
    isEnabled: () => loggingEnabled,
  };
};
