import { LogContext } from '@grafana/faro-web-sdk';

import { config } from '../config';

import { createMonitoringLogger } from './logging';

type StructuredConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'trace';

type StructuredConsolePayload = {
  level: StructuredConsoleMethod;
  message: string;
  args: unknown[];
  timestamp: string;
};

export type StructuredConsole = Pick<Console, StructuredConsoleMethod>;

const STRUCTURED_CONSOLE_KEY = '__grafanaStructuredConsole';
const monitoringLogger = createMonitoringLogger('core.structured-console');
const rawConsole = console;

function normalizeArgument(argument: unknown): unknown {
  if (argument instanceof Error) {
    return {
      name: argument.name,
      message: argument.message,
      stack: argument.stack,
    };
  }

  if (typeof argument === 'bigint' || typeof argument === 'symbol') {
    return String(argument);
  }

  if (typeof argument === 'function') {
    return `[function ${argument.name || 'anonymous'}]`;
  }

  return argument;
}

function getMessageFromArgs(level: StructuredConsoleMethod, args: unknown[]): string {
  const [first] = args;

  if (typeof first === 'string' && first.length > 0) {
    return first;
  }

  if (first instanceof Error && first.message.length > 0) {
    return first.message;
  }

  return `console.${level}`;
}

function toPayload(level: StructuredConsoleMethod, args: unknown[]): StructuredConsolePayload {
  return {
    level,
    message: getMessageFromArgs(level, args),
    args: args.map(normalizeArgument),
    timestamp: new Date().toISOString(),
  };
}

function toContext(payload: StructuredConsolePayload): LogContext {
  return {
    console: payload,
  };
}

function getConsoleError(payload: StructuredConsolePayload): Error {
  const firstError = payload.args.find((arg): arg is { name?: string; message?: string; stack?: string } => {
    if (!arg || typeof arg !== 'object') {
      return false;
    }

    const candidate = arg as Record<string, unknown>;
    return typeof candidate.name === 'string' && typeof candidate.message === 'string';
  });

  if (firstError) {
    const error = new Error(firstError.message || payload.message);
    error.name = firstError.name || error.name;
    error.stack = firstError.stack || error.stack;
    return error;
  }

  return new Error(payload.message);
}

function emitStructuredLog(method: StructuredConsoleMethod, args: unknown[]) {
  const payload = toPayload(method, args);
  const context = toContext(payload);

  switch (method) {
    case 'error':
      monitoringLogger.logError(getConsoleError(payload), context);
      break;
    case 'warn':
      monitoringLogger.logWarning(payload.message, context);
      break;
    case 'debug':
    case 'trace':
      monitoringLogger.logDebug(payload.message, context);
      break;
    case 'log':
    case 'info':
      monitoringLogger.logInfo(payload.message, context);
      break;
  }

  if (config.buildInfo.env === 'development') {
    (rawConsole[method] as (...items: unknown[]) => void)(payload);
  }
}

export function createStructuredConsole(): StructuredConsole {
  return {
    log: (...args: unknown[]) => emitStructuredLog('log', args),
    info: (...args: unknown[]) => emitStructuredLog('info', args),
    warn: (...args: unknown[]) => emitStructuredLog('warn', args),
    error: (...args: unknown[]) => emitStructuredLog('error', args),
    debug: (...args: unknown[]) => emitStructuredLog('debug', args),
    trace: (...args: unknown[]) => emitStructuredLog('trace', args),
  };
}

export function installStructuredConsole(structuredConsole: StructuredConsole = createStructuredConsole()): StructuredConsole {
  const existing = Reflect.get(globalThis, STRUCTURED_CONSOLE_KEY);

  if (existing) {
    return existing as StructuredConsole;
  }

  Reflect.set(globalThis, STRUCTURED_CONSOLE_KEY, structuredConsole);
  return structuredConsole;
}
