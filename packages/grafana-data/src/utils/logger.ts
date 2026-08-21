export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Record<string, string>;

export interface LogRecord {
  level: LogLevel;
  source: string;
  message: string;
  error?: Error;
  context?: LogContext;
}

export type LogSink = (record: LogRecord) => void;

function serialize(value: unknown): string {
  if (value === undefined) {
    return 'undefined';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (value instanceof Error) {
    return value.stack ?? value.message;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeArgs(args: unknown[]): { message: string; error?: Error; context?: LogContext } {
  const error = args.find((arg): arg is Error => arg instanceof Error);
  const withoutError = args.filter((arg) => arg !== error);

  let message: string;
  let extra: unknown[];
  if (typeof withoutError[0] === 'string') {
    message = withoutError[0];
    extra = withoutError.slice(1);
  } else if (withoutError.length === 0) {
    message = error?.message ?? '';
    extra = [];
  } else {
    extra = withoutError;
    message = error?.message ?? serialize(withoutError[0]);
  }

  const context: LogContext = {};
  if (extra.length === 1 && isPlainObject(extra[0])) {
    for (const [key, value] of Object.entries(extra[0])) {
      context[key] = serialize(value);
    }
  } else if (extra.length > 0) {
    context.args = extra.map(serialize).join(' ');
  }

  return { message, error, context: Object.keys(context).length > 0 ? context : undefined };
}

/**
 * Default sink: print a message plus a `{ source, ...context }` object so browser
 * consoles and tests still see a readable first argument.
 */
export const defaultLogSink: LogSink = (record) => {
  const meta = { source: record.source, ...record.context };
  const print =
    record.level === 'debug'
      ? // eslint-disable-next-line no-console
        console.debug
      : record.level === 'info'
        ? console.log
        : record.level === 'warn'
          ? console.warn
          : console.error;

  if (record.error) {
    print(record.message, meta, record.error);
    return;
  }

  print(record.message, meta);
};

let sink: LogSink = defaultLogSink;

export function setLogSink(next: LogSink) {
  sink = next;
}

export function resetLogSink() {
  sink = defaultLogSink;
}

export interface StructuredLogger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Creates a source-tagged logger. Call sites pass the same arguments they used
 * to pass to `console.*`; the sink records level, source, message, and context.
 */
export function createStructuredLogger(source: string): StructuredLogger {
  const emit = (level: LogLevel, args: unknown[]) => {
    const normalized = normalizeArgs(args);
    sink({
      level,
      source,
      message: normalized.message,
      error: normalized.error,
      context: normalized.context,
    });
  };

  return {
    debug: (...args: unknown[]) => emit('debug', args),
    info: (...args: unknown[]) => emit('info', args),
    warn: (...args: unknown[]) => emit('warn', args),
    error: (...args: unknown[]) => emit('error', args),
  };
}
