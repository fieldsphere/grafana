import { logInfo } from '@grafana/data';
import { throttle } from 'lodash';

type Args = unknown[];

/**
 * @internal
 * */
const throttledLog = throttle((...t: Args) => {
  logInfo(t[0], ...t.slice(1));
}, 500);

/**
 * @internal
 */
export interface Logger {
  logger: (id: string, throttleOrFirstArg?: boolean | unknown, ...t: Args) => void;
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
    logger: (id: string, throttleOrFirstArg = false, ...t: Args) => {
      if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' || !loggingEnabled) {
        return;
      }
      const throttle = typeof throttleOrFirstArg === 'boolean' ? throttleOrFirstArg : false;
      const args = typeof throttleOrFirstArg === 'boolean' ? t : [throttleOrFirstArg, ...t];
      const fn = throttle ? throttledLog : logInfo;
      fn(`[${name}: ${id}]:`, ...args);
    },
    enable: () => (loggingEnabled = true),
    disable: () => (loggingEnabled = false),
    isEnabled: () => loggingEnabled,
  };
};
