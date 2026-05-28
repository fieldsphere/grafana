export type StructuredLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogRecord {
  level: StructuredLogLevel;
  source: string;
  message: string;
  context?: Record<string, unknown>;
}

export type StructuredLogSink = (record: StructuredLogRecord) => void;

let sink: StructuredLogSink | undefined;

export function setStructuredLogSink(nextSink?: StructuredLogSink) {
  sink = nextSink;
}

export interface StructuredLogger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export function createStructuredLogger(source: string): StructuredLogger {
  const emit = (level: StructuredLogLevel, args: unknown[]) => {
    if (!sink) {
      return;
    }

    const [firstArg, ...restArgs] = args;
    const message = typeof firstArg === 'string' ? firstArg : source;
    const context: Record<string, unknown> = restArgs.length > 0 ? { args: restArgs } : {};

    if (firstArg !== undefined && typeof firstArg !== 'string') {
      context.value = firstArg;
    }

    sink({
      level,
      source,
      message,
      context: Object.keys(context).length > 0 ? context : undefined,
    });
  };

  return {
    debug: (...args) => emit('debug', args),
    info: (...args) => emit('info', args),
    warn: (...args) => emit('warn', args),
    error: (...args) => emit('error', args),
  };
}
