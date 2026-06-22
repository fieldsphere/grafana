import { getLogger } from '@grafana/runtime/unstable';

const logger = getLogger('frontend.console');

type LogArgs = unknown[];
type LogMethod = 'debug' | 'error' | 'info' | 'log' | 'trace' | 'warn';

function toMessage(args: LogArgs): string {
  const [first] = args;

  if (typeof first === 'string') {
    return first;
  }

  if (first instanceof Error) {
    return first.message;
  }

  return stringifyValue(first ?? 'Log message');
}

function toContext(args: LogArgs): Record<string, string> | undefined {
  if (args.length <= 1) {
    return undefined;
  }

  return Object.fromEntries(args.slice(1).map((value, index) => [`arg${index + 1}`, stringifyValue(value)]));
}

function stringifyValue(value: unknown): string {
  if (value instanceof Error) {
    return value.stack ?? value.message;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  if (value === undefined) {
    return 'undefined';
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toError(args: LogArgs): Error {
  const [first] = args;

  if (first instanceof Error) {
    return first;
  }

  return new Error(toMessage(args));
}

function mirrorInTests(method: LogMethod, args: LogArgs): void {
  if (process.env.NODE_ENV !== 'test') {
    return;
  }

  globalThis['console'][method](...args);
}

export const structuredLogger = {
  debug: (...args: LogArgs): void => {
    mirrorInTests('debug', args);
    logger.logDebug(toMessage(args), toContext(args));
  },
  error: (...args: LogArgs): void => {
    mirrorInTests('error', args);
    logger.logError(toError(args), toContext(args));
  },
  info: (...args: LogArgs): void => {
    mirrorInTests('info', args);
    logger.logInfo(toMessage(args), toContext(args));
  },
  log: (...args: LogArgs): void => {
    mirrorInTests('log', args);
    logger.logInfo(toMessage(args), toContext(args));
  },
  trace: (...args: LogArgs): void => {
    mirrorInTests('trace', args);
    logger.logDebug(toMessage(args), toContext(args));
  },
  warn: (...args: LogArgs): void => {
    mirrorInTests('warn', args);
    logger.logWarning(toMessage(args), toContext(args));
  },
};
