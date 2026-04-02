/* eslint-disable no-console */
import { createMonitoringLogger, type MonitoringLogger } from '@grafana/runtime';

type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'trace';
type ConsoleMethod = (...args: unknown[]) => void;

const logger = createMonitoringLogger('frontend.console');
const STRUCTURED_CONSOLE_PATCH_FLAG = '__grafanaStructuredConsoleLoggingPatched__';

type BrowserWindowWithPatchFlag = Window & {
  [STRUCTURED_CONSOLE_PATCH_FLAG]?: boolean;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function toSerializableValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return value;
  }

  if (valueType === 'bigint' || valueType === 'function' || valueType === 'symbol') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(toSerializableValue);
  }

  if (isPlainObject(value)) {
    const visited = new WeakSet<object>();
    try {
      return JSON.parse(
        JSON.stringify(value, (_key, nestedValue) => {
          if (!nestedValue || typeof nestedValue !== 'object') {
            return nestedValue;
          }

          if (visited.has(nestedValue)) {
            return '[Circular]';
          }

          visited.add(nestedValue);
          return nestedValue;
        })
      );
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function getDefaultMessage(level: ConsoleLevel) {
  return `console.${level}`;
}

export function normalizeConsoleLog(
  level: ConsoleLevel,
  args: unknown[]
): { message: string; context: Record<string, unknown>; error?: Error } {
  if (args.length === 0) {
    return {
      message: getDefaultMessage(level),
      context: {
        console_level: level,
        console_args: [],
      },
    };
  }

  const [firstArg, ...rest] = args;
  const firstArgIsError = firstArg instanceof Error;
  const firstArgIsString = typeof firstArg === 'string';

  let message = getDefaultMessage(level);
  if (firstArgIsError) {
    message = firstArg.message || getDefaultMessage(level);
  } else if (firstArgIsString) {
    message = firstArg;
  } else {
    const serializedFirstArg = toSerializableValue(firstArg);
    if (typeof serializedFirstArg === 'string') {
      message = serializedFirstArg;
    }
  }

  const serializedArgs = (firstArgIsError || firstArgIsString ? rest : args).map(toSerializableValue);
  const context: Record<string, unknown> = {
    console_level: level,
    console_args: serializedArgs,
  };

  if (firstArgIsError) {
    context.error_name = firstArg.name;
  }

  return {
    message,
    context,
    error: firstArgIsError ? firstArg : undefined,
  };
}

export function logStructuredConsole(level: ConsoleLevel, args: unknown[], monitoringLogger: MonitoringLogger = logger) {
  const normalized = normalizeConsoleLog(level, args);

  switch (level) {
    case 'error':
      monitoringLogger.logError(normalized.error ?? new Error(normalized.message), normalized.context);
      return;
    case 'warn':
      monitoringLogger.logWarning(normalized.message, normalized.context);
      return;
    case 'debug':
    case 'trace':
      monitoringLogger.logDebug(normalized.message, normalized.context);
      return;
    case 'log':
    case 'info':
      monitoringLogger.logInfo(normalized.message, normalized.context);
      return;
  }
}

function createPatchedConsoleMethod(
  level: ConsoleLevel,
  originalMethod: ConsoleMethod,
  monitoringLogger: MonitoringLogger
): ConsoleMethod {
  return (...args: unknown[]) => {
    logStructuredConsole(level, args, monitoringLogger);
    originalMethod(...args);
  };
}

function getBrowserWindowWithPatchFlag(): BrowserWindowWithPatchFlag | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window;
}

export function initStructuredConsoleLogging(monitoringLogger: MonitoringLogger = logger) {
  const browserWindow = getBrowserWindowWithPatchFlag();
  if (!browserWindow) {
    return;
  }

  if (browserWindow[STRUCTURED_CONSOLE_PATCH_FLAG]) {
    return;
  }

  browserWindow[STRUCTURED_CONSOLE_PATCH_FLAG] = true;

  const originalConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
    trace: console.trace.bind(console),
  };

  console.log = createPatchedConsoleMethod('log', originalConsole.log, monitoringLogger);
  console.info = createPatchedConsoleMethod('info', originalConsole.info, monitoringLogger);
  console.warn = createPatchedConsoleMethod('warn', originalConsole.warn, monitoringLogger);
  console.error = createPatchedConsoleMethod('error', originalConsole.error, monitoringLogger);
  console.debug = createPatchedConsoleMethod('debug', originalConsole.debug, monitoringLogger);
  console.trace = createPatchedConsoleMethod('trace', originalConsole.trace, monitoringLogger);
}
