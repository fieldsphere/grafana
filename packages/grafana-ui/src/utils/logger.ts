import { structuredLog, toLogContextPart } from '@grafana/data';
import { throttle } from 'lodash';

type Args = Parameters<typeof console.log>;

/**
 * @internal
 * */
const throttledLog = throttle((prefix: string, ...t: Args) => {
  structuredLog('info', prefix, { extras: t.map((x) => toLogContextPart(x)) });
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
      const label = `[${name}: ${id}]:`;
      if (throttle) {
        throttledLog(label, ...t);
        return;
      }
      structuredLog('info', label, { extras: t.map((x) => toLogContextPart(x)) });
    },
    enable: () => (loggingEnabled = true),
    disable: () => (loggingEnabled = false),
    isEnabled: () => loggingEnabled,
  };
};
