import type { LogContext } from '@grafana/faro-web-sdk';
import { createMonitoringLogger } from '@grafana/runtime';

const faroLogger = createMonitoringLogger('app.core.structured');

function getCircularReplacer() {
  const seen = new WeakSet<object>();
  return (_key: string, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
}

function safeSerialize(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  const valueType = typeof value;
  if (valueType === 'string') {
    return value;
  }
  if (valueType === 'number' || valueType === 'boolean' || valueType === 'bigint') {
    return String(value);
  }
  if (valueType === 'symbol') {
    return value.toString();
  }
  if (value instanceof Error) {
    return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ''}`;
  }
  if (valueType === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`;
  }
  try {
    return JSON.stringify(value, getCircularReplacer());
  } catch {
    return Object.prototype.toString.call(value);
  }
}

function argsToLogContext(args: readonly unknown[]): LogContext {
  const ctx: Record<string, string> = {};
  args.forEach((arg, i) => {
    ctx[`arg${i}`] = safeSerialize(arg);
  });
  return ctx;
}

function deriveMessage(args: unknown[]): string {
  if (args.length === 0) {
    return '(no message)';
  }
  if (args.length === 1) {
    return safeSerialize(args[0]);
  }
  return args.map(safeSerialize).join(' ');
}

function primaryMessage(args: unknown[]): string {
  if (args.length > 0 && typeof args[0] === 'string') {
    return args[0];
  }
  return deriveMessage(args);
}

function passthrough(
  method: 'log' | 'info' | 'warn' | 'error' | 'debug' | 'dir' | 'trace' | 'table',
  args: unknown[]
): void {
  switch (method) {
    case 'log':
      // Intentional console passthrough for local debugging (dev/test only).
      // eslint-disable-next-line no-console
      console.log(...args);
      break;
    case 'info':
      // eslint-disable-next-line no-console
      console.info(...args);
      break;
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn(...args);
      break;
    case 'error':
      // eslint-disable-next-line no-console
      console.error(...args);
      break;
    case 'debug':
      // eslint-disable-next-line no-console
      console.debug(...args);
      break;
    case 'dir':
      // eslint-disable-next-line no-console
      console.dir(...args);
      break;
    case 'trace':
      // eslint-disable-next-line no-console
      console.trace(...args);
      break;
    case 'table':
      // eslint-disable-next-line no-console
      console.table(...args);
      break;
  }
}

export const structuredLogger = {
  log: (...args: unknown[]) => {
    faroLogger.logInfo(primaryMessage(args), argsToLogContext(args));
    passthrough('log', args);
  },

  info: (...args: unknown[]) => {
    faroLogger.logInfo(primaryMessage(args), argsToLogContext(args));
    passthrough('info', args);
  },

  warn: (...args: unknown[]) => {
    faroLogger.logWarning(primaryMessage(args), argsToLogContext(args));
    passthrough('warn', args);
  },

  debug: (...args: unknown[]) => {
    faroLogger.logDebug(primaryMessage(args), argsToLogContext(args));
    passthrough('debug', args);
  },

  dir: (...args: unknown[]) => {
    faroLogger.logDebug(primaryMessage(args), argsToLogContext(args));
    passthrough('dir', args);
  },

  trace: (...args: unknown[]) => {
    faroLogger.logDebug(primaryMessage(args), argsToLogContext(args));
    passthrough('trace', args);
  },

  table: (...args: unknown[]) => {
    faroLogger.logDebug(primaryMessage(args), argsToLogContext(args));
    passthrough('table', args);
  },

  error: (...args: unknown[]): Error => {
    const context = argsToLogContext(args);
    const error = args[0] instanceof Error ? args[0] : new Error(deriveMessage(args));

    try {
      faroLogger.logError(error, context);
    } catch {
      // Logging transport failures should never break application behavior.
    }

    passthrough('error', args);
    return error;
  },
};
