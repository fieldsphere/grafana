type StructuredLogLevel = 'debug' | 'error' | 'groupCollapsed' | 'groupEnd' | 'info' | 'log' | 'warn';

export interface StructuredLogger {
  debug: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  groupCollapsed: (...args: unknown[]) => void;
  groupEnd: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}

interface StructuredLogEntry {
  level: StructuredLogLevel;
  message: string;
  source: string;
  args?: unknown[];
}

function toMessage(args: unknown[]) {
  const [firstArg] = args;

  if (typeof firstArg === 'string') {
    return firstArg;
  }

  if (firstArg instanceof Error) {
    return firstArg.message;
  }

  return 'Grafana log event';
}

function toEntry(source: string, level: StructuredLogLevel, args: unknown[]): StructuredLogEntry {
  return {
    level,
    message: toMessage(args),
    source,
    ...(args.length > 0 ? { args } : {}),
  };
}

function writeLog(source: string, level: StructuredLogLevel, args: unknown[]) {
  const logger = globalThis['console'];
  const log = logger?.[level] ?? logger?.log;

  if (typeof log !== 'function') {
    return;
  }

  log.call(logger, toEntry(source, level, args));
}

export function createStructuredLogger(source: string): StructuredLogger {
  return {
    debug: (...args: unknown[]) => writeLog(source, 'debug', args),
    error: (...args: unknown[]) => writeLog(source, 'error', args),
    groupCollapsed: (...args: unknown[]) => writeLog(source, 'groupCollapsed', args),
    groupEnd: (...args: unknown[]) => writeLog(source, 'groupEnd', args),
    info: (...args: unknown[]) => writeLog(source, 'info', args),
    log: (...args: unknown[]) => writeLog(source, 'log', args),
    warn: (...args: unknown[]) => writeLog(source, 'warn', args),
  };
}
