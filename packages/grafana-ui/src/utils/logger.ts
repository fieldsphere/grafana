import { throttle } from 'lodash';

import { faro, LogLevel } from '@grafana/faro-web-sdk';

type Args = Parameters<typeof console.log>;

function emitFallbackDebugLine(name: string, id: string, args: Args) {
  const line = JSON.stringify({
    level: 'DEBUG',
    source: `grafana-ui.createLogger.${name}`,
    id,
    timestamp: Date.now(),
    ...(args.length > 0
      ? {
          details: (() => {
            try {
              return JSON.stringify(args);
            } catch {
              return String(args);
            }
          })(),
        }
      : {}),
  });
  // eslint-disable-next-line no-console
  console.debug(line);
}

function pushDebugLog(name: string, id: string, args: Args) {
  const message = `[${name}: ${id}]`;
  const context =
    args.length > 0
      ? {
          details: (() => {
            try {
              return JSON.stringify(args);
            } catch {
              return String(args);
            }
          })(),
        }
      : undefined;
  if (typeof faro.api?.pushLog === 'function') {
    faro.api.pushLog([message], {
      level: LogLevel.DEBUG,
      context,
    });
  } else {
    emitFallbackDebugLine(name, id, args);
  }
}

/**
 * @internal
 */
const throttledPush = throttle((name: string, id: string, args: Args) => {
  pushDebugLog(name, id, args);
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
        throttledPush(name, id, t);
      } else {
        pushDebugLog(name, id, t);
      }
    },
    enable: () => (loggingEnabled = true),
    disable: () => (loggingEnabled = false),
    isEnabled: () => loggingEnabled,
  };
};
