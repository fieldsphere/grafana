import { createStructuredLogger } from '@grafana/data';
import { throttle } from 'lodash';

const structuredLogger = createStructuredLogger('packages/grafana-ui/src/utils/logger');
type Args = Parameters<typeof structuredLogger.info>;

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
      const fn = throttle ? throttledLog : structuredLogger.info;
      fn(`[${name}: ${id}]:`, ...t);
    },
    enable: () => (loggingEnabled = true),
    disable: () => (loggingEnabled = false),
    isEnabled: () => loggingEnabled,
  };
};
