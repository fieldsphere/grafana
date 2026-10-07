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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Error);
}

/** BackendSrv rejects with a plain FetchError, not an Error instance. */
function isFetchErrorLike(value: Record<string, unknown>): boolean {
  return 'status' in value && 'data' in value && isPlainObject(value.config) && typeof value.config.url === 'string';
}

function isRequestLike(value: Record<string, unknown>): boolean {
  return (
    typeof value.url === 'string' &&
    ('method' in value || 'data' in value || 'body' in value || 'headers' in value || 'params' in value)
  );
}

/** Query strings and userinfo are request data and can carry tokens. */
function stripUrlSecrets(url: string): string {
  try {
    const parsed = new URL(url, 'http://grafana.invalid');
    parsed.username = '';
    parsed.password = '';
    parsed.search = '';
    parsed.hash = '';
    if (!/^[a-z][a-z\d+.-]*:/i.test(url)) {
      return parsed.pathname;
    }
    return parsed.toString();
  } catch {
    const cut = url.search(/[?#]/);
    return cut === -1 ? url : url.slice(0, cut);
  }
}

/**
 * Faro context is serialized and shipped remotely. FetchError embeds the request
 * body, headers, and the response payload, so those fields must not be forwarded.
 */
function redactForRemote(value: unknown): unknown {
  if (!isPlainObject(value)) {
    return value;
  }

  if (isFetchErrorLike(value)) {
    const redacted: Record<string, unknown> = {};
    if ('status' in value) {
      redacted.status = value.status;
    }
    if (typeof value.statusText === 'string') {
      redacted.statusText = value.statusText;
    }
    if (typeof value.message === 'string') {
      redacted.message = value.message;
    }
    if ('cancelled' in value) {
      redacted.cancelled = value.cancelled;
    }
    if (typeof value.traceId === 'string') {
      redacted.traceId = value.traceId;
    }
    redacted.config = value.config;
    return redacted;
  }

  if (isRequestLike(value)) {
    const redacted: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key === 'data' || key === 'body' || key === 'headers' || key === 'params') {
        continue;
      }
      redacted[key] = key === 'url' && typeof nested === 'string' ? stripUrlSecrets(nested) : nested;
    }
    return redacted;
  }

  return value;
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
    const json = JSON.stringify(value, (_key, nested) => redactForRemote(nested));
    if (typeof json === 'string') {
      return json;
    }
  } catch {
    // Circular structures and other non-JSON values fall through to String().
  }
  return String(value);
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
    const remoteContext = redactForRemote(rawContext);
    const contextSource = isPlainObject(remoteContext) ? remoteContext : rawContext;
    const context: StructuredLogContext = {};
    for (const [key, value] of Object.entries(contextSource)) {
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
