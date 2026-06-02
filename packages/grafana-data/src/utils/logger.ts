export type StructuredLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogEntry {
  level: StructuredLogLevel;
  message: string;
  source: string;
  context?: unknown[];
}

export interface StructuredLogger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

function toLogEntry(source: string, level: StructuredLogLevel, args: unknown[]): StructuredLogEntry {
  const [message, ...context] = args;

  return {
    level,
    message: typeof message === 'string' ? message : String(message),
    source,
    ...(context.length > 0 && { context }),
  };
}

function writeLog(level: StructuredLogLevel, entry: StructuredLogEntry): void {
  const logFn = globalThis.console?.[level] ?? globalThis.console?.log;
  logFn?.(entry);
}

export function createStructuredLogger(source: string): StructuredLogger {
  return {
    debug: (...args: unknown[]) => writeLog('debug', toLogEntry(source, 'debug', args)),
    info: (...args: unknown[]) => writeLog('info', toLogEntry(source, 'info', args)),
    warn: (...args: unknown[]) => writeLog('warn', toLogEntry(source, 'warn', args)),
    error: (...args: unknown[]) => writeLog('error', toLogEntry(source, 'error', args)),
  };
}
