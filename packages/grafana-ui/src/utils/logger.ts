import { throttle } from 'lodash';

type Args = Parameters<typeof console.log>;

/**
 * @internal
 * */
const throttledLog = throttle((...t: Args) => {
  console.info({
    source: "packages/grafana-ui/src/utils/logger.ts",
    message: "log",
    data: [...t]
  });
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
      const message = `[${name}: ${id}]:`;
      if (throttle) {
        throttledLog(message, ...t);
        return;
      }

      console.info({
        source: 'packages/grafana-ui/src/utils/logger.ts',
        message,
        data: [...t],
      });
    },
    enable: () => (loggingEnabled = true),
    disable: () => (loggingEnabled = false),
    isEnabled: () => loggingEnabled,
  };
};
