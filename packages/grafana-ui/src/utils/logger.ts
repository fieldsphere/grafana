import { throttle } from 'lodash';

type Args = Parameters<typeof console.log>;

/**
 * Log context for structured logging
 */
export interface LogContext {
  [key: string]: string | number | boolean | undefined;
}

const throttledLog = throttle((...t: Args) => {
  // eslint-disable-next-line no-console
  console.log(...t);
}, 500);

/**
 * @internal
 */
export interface Logger {
  logger: (id: string, throttle?: boolean, ...t: Args) => void;
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, error?: Error, context?: LogContext) => void;
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
}

function formatContext(name: string, context?: LogContext): string {
  const ctx = context ? ` ${JSON.stringify(context)}` : '';
  return `[${name}]${ctx}`;
}

/** @internal */
export const createLogger = (name: string): Logger => {
  let loggingEnabled = false;

  if (typeof window !== 'undefined') {
    loggingEnabled = window.localStorage.getItem('grafana.debug') === 'true';
  }

  const shouldLog = () => {
    return process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test' && loggingEnabled;
  };

  return {
    logger: (id: string, throttle = false, ...t: Args) => {
      if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' || !loggingEnabled) {
        return;
      }
      const fn = throttle ? throttledLog : console.log;
      fn(`[${name}: ${id}]:`, ...t);
    },
    debug: (message: string, context?: LogContext) => {
      if (shouldLog()) {
        // eslint-disable-next-line no-console
        console.debug(`${formatContext(name, context)} ${message}`);
      }
    },
    info: (message: string, context?: LogContext) => {
      if (shouldLog()) {
        // eslint-disable-next-line no-console
        console.info(`${formatContext(name, context)} ${message}`);
      }
    },
    warn: (message: string, context?: LogContext) => {
      // eslint-disable-next-line no-console
      console.warn(`${formatContext(name, context)} ${message}`);
    },
    error: (message: string, error?: Error, context?: LogContext) => {
      // eslint-disable-next-line no-console
      console.error(`${formatContext(name, context)} ${message}`, error ?? '');
    },
    enable: () => (loggingEnabled = true),
    disable: () => (loggingEnabled = false),
    isEnabled: () => loggingEnabled,
  };
};
