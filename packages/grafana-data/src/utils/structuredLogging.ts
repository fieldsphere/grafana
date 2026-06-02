export type StructuredLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogRecord {
  level: StructuredLogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

type ConsoleMethod = 'debug' | 'info' | 'warn' | 'error';

const consoleMethodByLevel: Record<StructuredLogLevel, ConsoleMethod> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

function serializeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  return value;
}

function getMessage(message: unknown): string {
  if (typeof message === 'string') {
    return message;
  }

  if (message instanceof Error) {
    return message.message;
  }

  try {
    const serialized = JSON.stringify(message);
    return serialized === undefined ? String(message) : serialized;
  } catch {
    return String(message);
  }
}

export function emitStructuredLog(level: StructuredLogLevel, message: unknown, ...args: unknown[]): void {
  const record: StructuredLogRecord = {
    level,
    message: getMessage(message),
    timestamp: new Date().toISOString(),
  };

  const serializedArgs = args.map(serializeValue);
  if (serializedArgs.length > 0) {
    record.context = { args: serializedArgs };
  }

  const method = consoleMethodByLevel[level];
  globalThis.console?.[method]?.(record);
}

export function logDebug(message: unknown, ...args: unknown[]): void {
  emitStructuredLog('debug', message, ...args);
}

export function logInfo(message: unknown, ...args: unknown[]): void {
  emitStructuredLog('info', message, ...args);
}

export function logWarn(message: unknown, ...args: unknown[]): void {
  emitStructuredLog('warn', message, ...args);
}

export function logError(message: unknown, ...args: unknown[]): void {
  emitStructuredLog('error', message, ...args);
}
