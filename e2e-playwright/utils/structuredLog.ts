type StructuredLogLevel = 'debug' | 'info' | 'warn' | 'error';

type StructuredLogContext = Record<string, unknown>;

const serializeContextValue = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  return value;
};

export function structuredLog(level: StructuredLogLevel, event: string, context: StructuredLogContext = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...Object.fromEntries(Object.entries(context).map(([key, value]) => [key, serializeContextValue(value)])),
  };

  const message = JSON.stringify(payload);

  switch (level) {
    case 'debug':
    case 'info':
      console.log(message);
      return;
    case 'warn':
      console.warn(message);
      return;
    case 'error':
      console.error(message);
      return;
  }
}
