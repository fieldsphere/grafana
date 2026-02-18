import { throttle } from 'lodash';

type Args = Parameters<typeof console.log>;

/**
 * @internal
 * */
const throttledLog = throttle((...t: Args) => {
  Reflect.apply(Reflect.get(globalThis, '__structuredLog') ?? Reflect.get(console, 'info'), console, [{ timestamp: new Date().toISOString(), level: 'info', source: 'packages/grafana-ui/src/utils/logger.ts', args: [...t] }]);
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
      const fn = throttle ? throttledLog : console.log;
      fn(`[${name}: ${id}]:`, ...t);
    },
    enable: () => (loggingEnabled = true),
    disable: () => (loggingEnabled = false),
    isEnabled: () => loggingEnabled,
  };
};
