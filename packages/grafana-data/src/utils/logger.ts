export type StructuredLogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Faro log context is string-only, so every value is serialized before it is forwarded. */
export type StructuredLogContext = Record<string, string>;

export interface LogRecord {
  level: StructuredLogLevel;
  source: string;
  message: string;
  error?: Error;
  context?: StructuredLogContext;
  /**
   * Original plain-object argument. The local console sink prints this so DevTools can
   * expand it. Faro receives `context` instead, which is safe to serialize.
   */
  rawContext?: Record<string, unknown>;
  /** When false, the record stays on the local sink and is not forwarded to Faro. */
  remote: boolean;
}

export type LogSink = (record: LogRecord) => void;

export interface StructuredLoggerOptions {
  /**
   * Forward records to the Faro sink installed by `initializeLoggersRegistry`.
   * Set false for payloads that must stay on the machine: unsanitized HTML,
   * user data, or diagnostics that would duplicate a logger that already reports to Faro.
   * Defaults to true.
   */
  remote?: boolean;
}

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
    const json = JSON.stringify(value);
    if (typeof json === 'string') {
      return json;
    }
  } catch {
    // Circular structures and other non-JSON values fall through to String().
  }
  return String(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Error);
}

function normalizeArgs(args: unknown[]): {
  message: string;
  error?: Error;
  context?: StructuredLogContext;
  rawContext?: Record<string, unknown>;
} {
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

  if (extra.length === 1 && isPlainObject(extra[0])) {
    const rawContext = extra[0];
    const context: StructuredLogContext = {};
    for (const [key, value] of Object.entries(rawContext)) {
      context[key] = serialize(value);
    }
    return {
      message,
      error,
      context: Object.keys(context).length > 0 ? context : undefined,
      rawContext: Object.keys(rawContext).length > 0 ? rawContext : undefined,
    };
  }

  if (extra.length > 0) {
    return { message, error, context: { args: extra.map(serialize).join(' ') } };
  }

  return { message, error };
}

/**
 * Local sink. Prints the message plus `{ source, ...context }` so browser consoles
 * and tests still see a readable first argument.
 */
export const defaultLogSink: LogSink = (record) => {
  const meta = { source: record.source, ...(record.rawContext ?? record.context) };
  const print =
    record.level === 'debug'
      ? // debug is the structured level; the allowed console methods do not include it.
        // eslint-disable-next-line no-console
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
 * Source-tagged logger. Call sites pass the same arguments they used to pass to `console.*`.
 * The active sink records level, source, message, and context.
 */
export function createStructuredLogger(source: string, options?: StructuredLoggerOptions): StructuredLogger {
  const remote = options?.remote !== false;

  const emit = (level: StructuredLogLevel, args: unknown[]) => {
    const normalized = normalizeArgs(args);
    const record: LogRecord = {
      level,
      source,
      message: normalized.message,
      remote,
    };
    if (normalized.error) {
      record.error = normalized.error;
    }
    if (normalized.context) {
      record.context = normalized.context;
    }
    if (normalized.rawContext) {
      record.rawContext = normalized.rawContext;
    }

    try {
      sink(record);
    } catch (sinkError) {
      // A broken sink must not take down the caller. Fall back to the console directly
      // so this path cannot re-enter the sink.
      console.error('Structured logger sink failed', sinkError);
    }
  };

  return {
    debug: (...args: unknown[]) => emit('debug', args),
    info: (...args: unknown[]) => emit('info', args),
    warn: (...args: unknown[]) => emit('warn', args),
    error: (...args: unknown[]) => emit('error', args),
  };
}
