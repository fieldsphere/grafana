/** Mirrors @grafana/data structured logs without taking a dependency on that package (i18n has a narrower TS/browser surface). */

type StructuredLevel = 'debug' | 'info' | 'warn' | 'error';

export function toLogContextPart(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

export function structuredLog(level: StructuredLevel, message: string, context?: Record<string, unknown>): void {
  const payload = JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context && Object.keys(context).length > 0 ? { context } : {}),
  });
  switch (level) {
    case 'debug':
    case 'info':
      console.log(payload);
      break;
    case 'warn':
      console.warn(payload);
      break;
    case 'error':
      console.error(payload);
      break;
  }
}
