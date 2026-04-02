export type StructuredLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

type ConsoleMethod = 'debug' | 'error' | 'info' | 'log' | 'trace' | 'warn';
type StructuredLogArgs = unknown[];
type StructuredLogValue = null | boolean | number | string | StructuredLogValue[] | { [key: string]: StructuredLogValue };

interface StructuredLogEntry {
  ts: string;
  level: StructuredLogLevel;
  source: string;
  msg: string;
  context?: StructuredLogValue;
  args?: StructuredLogValue;
}

export interface StructuredLogger {
  log: (...args: StructuredLogArgs) => void;
  info: (...args: StructuredLogArgs) => void;
  warn: (...args: StructuredLogArgs) => void;
  error: (...args: StructuredLogArgs) => void;
  debug: (...args: StructuredLogArgs) => void;
  trace: (...args: StructuredLogArgs) => void;
  groupCollapsed: (...args: StructuredLogArgs) => void;
  groupEnd: () => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function serializeValue(value: unknown, seen = new WeakSet<object>()): StructuredLogValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Error) {
    const serializedError: Record<string, StructuredLogValue> = {
      name: value.name,
      message: value.message,
    };

    if (value.stack) {
      serializedError.stack = value.stack;
    }

    if ('cause' in value && value.cause !== undefined) {
      serializedError.cause = serializeValue(value.cause, seen);
    }

    return serializedError;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item, seen));
  }

  switch (typeof value) {
    case 'bigint':
      return value.toString();
    case 'boolean':
    case 'number':
    case 'string':
      return value;
    case 'function':
      return `[Function ${value.name || 'anonymous'}]`;
    case 'symbol':
      return value.toString();
    case 'object': {
      if (seen.has(value)) {
        return '[Circular]';
      }

      seen.add(value);

      if (value instanceof Date) {
        return value.toISOString();
      }

      const output: Record<string, StructuredLogValue> = {};
      for (const [key, nestedValue] of Object.entries(value)) {
        output[key] = serializeValue(nestedValue, seen);
      }
      return output;
    }
    default:
      return String(value);
  }
}

function escapeLogfmtValue(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function formatLogfmtField(key: string, value: StructuredLogValue): string {
  if (value === null) {
    return `${key}=null`;
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return `${key}=${value}`;
  }

  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  return `${key}="${escapeLogfmtValue(stringValue)}"`;
}

function formatLogEntry(entry: StructuredLogEntry): string {
  const parts = [
    formatLogfmtField('ts', entry.ts),
    formatLogfmtField('level', entry.level),
    formatLogfmtField('source', entry.source),
    formatLogfmtField('msg', entry.msg),
  ];

  if (entry.context !== undefined) {
    parts.push(formatLogfmtField('context', entry.context));
  }

  if (entry.args !== undefined) {
    parts.push(formatLogfmtField('args', entry.args));
  }

  return parts.join(' ');
}

function normalizeArguments(args: StructuredLogArgs): Pick<StructuredLogEntry, 'args' | 'context' | 'msg'> {
  if (args.length === 0) {
    return { msg: 'Structured log event' };
  }

  const [first, ...rest] = args;

  if (typeof first === 'string') {
    if (rest.length === 1 && (isPlainObject(rest[0]) || rest[0] instanceof Error)) {
      return {
        msg: first,
        context: serializeValue(rest[0]),
      };
    }

    return {
      msg: first,
      args: rest.length > 0 ? serializeValue(rest) : undefined,
    };
  }

  if (first instanceof Error) {
    return {
      msg: first.message,
      context: serializeValue(first),
      args: rest.length > 0 ? serializeValue(rest) : undefined,
    };
  }

  if (args.length === 1 && isPlainObject(first)) {
    return {
      msg: 'Structured log event',
      context: serializeValue(first),
    };
  }

  return {
    msg: 'Structured log event',
    args: serializeValue(args),
  };
}

function getConsoleMethod(method: ConsoleMethod): (...args: unknown[]) => void {
  const consoleRef = globalThis.console;

  if (!consoleRef) {
    return () => {};
  }

  const targetMethod = consoleRef[method];
  if (typeof targetMethod === 'function') {
    return targetMethod.bind(consoleRef);
  }

  return consoleRef.log.bind(consoleRef);
}

function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
}

function write(level: StructuredLogLevel, source: string, args: StructuredLogArgs) {
  const entry: StructuredLogEntry = {
    ts: new Date().toISOString(),
    level,
    source,
    ...normalizeArguments(args),
  };

  const method: ConsoleMethod =
    level === 'error' ? 'error' : level === 'warn' ? 'warn' : level === 'debug' ? 'debug' : level === 'trace' ? 'trace' : 'info';

  getConsoleMethod(method)(formatLogEntry(entry));
}

export function createStructuredLogger(source: string): StructuredLogger {
  const timers = new Map<string, number>();

  return {
    log: (...args) => write('info', source, args),
    info: (...args) => write('info', source, args),
    warn: (...args) => write('warn', source, args),
    error: (...args) => write('error', source, args),
    debug: (...args) => write('debug', source, args),
    trace: (...args) => write('trace', source, args),
    groupCollapsed: (...args) => write('debug', source, ['Structured log group start', ...args]),
    groupEnd: () => write('debug', source, ['Structured log group end']),
    time: (label) => {
      timers.set(label, now());
    },
    timeEnd: (label) => {
      const start = timers.get(label);

      if (start === undefined) {
        write('warn', source, ['Structured log timer finished without a matching start', { label }]);
        return;
      }

      timers.delete(label);
      write('debug', source, ['Structured log timer completed', { label, durationMs: Number((now() - start).toFixed(3)) }]);
    },
  };
}
