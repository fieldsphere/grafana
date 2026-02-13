import { throttle } from 'lodash';
import { logUiDebug } from './structuredLogging';

type Args = unknown[];

/**
 * @internal
 * */
const throttledLog = throttle((...t: Args) => {
  logUiDebug('Grafana UI throttled debug log', { operation: 'throttledLog', args: t });
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
        throttledLog(`[${name}: ${id}]:`, ...t);
      } else {
        logUiDebug('Grafana UI debug log', {
          operation: 'createLogger.logger',
          loggerName: name,
          id,
          args: t,
        });
      }
    },
    enable: () => (loggingEnabled = true),
    disable: () => (loggingEnabled = false),
    isEnabled: () => loggingEnabled,
  };
};
