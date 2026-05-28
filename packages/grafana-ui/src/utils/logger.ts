import { throttle } from 'lodash';

import { createStructuredLogger } from '@grafana/data';

const structuredLog = createStructuredLogger('packages/grafana-ui/src/utils/logger.ts');

type Args = unknown[];

/**
 * @internal
 * */
const throttledLog = throttle((...t: Args) => {
  structuredLog.info(...t);
}, 500);

/**
 * @internal
 */
export interface Logger {
  logger: (id: string, throttle?: unknown, ...t: Args) => void;
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
      const fn = throttle ? throttledLog : structuredLog.info;
      fn(`[${name}: ${id}]:`, ...t);
    },
    enable: () => (loggingEnabled = true),
    disable: () => (loggingEnabled = false),
    isEnabled: () => loggingEnabled,
  };
};
