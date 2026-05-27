/** @internal */
export type StructuredLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogEntry {
  level: StructuredLogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

/**
 * Normalizes arbitrary values into something safe to place in structured log context.
 * @public
 */
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

function buildEntry(
  level: StructuredLogLevel,
  message: string,
  context?: Record<string, unknown>
): StructuredLogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context && Object.keys(context).length > 0 ? { context } : {}),
  };
}

/**
 * Single-line JSON logging for the browser (and Node). This is the standard replacement
 * for ad-hoc `console.*` calls when Faro / GJA is not available.
 *
 * @public
 */
export function structuredLog(level: StructuredLogLevel, message: string, context?: Record<string, unknown>): void {
  const line = JSON.stringify(buildEntry(level, message, context));
  switch (level) {
    case 'debug':
    case 'info':
      console.log(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    case 'error':
      console.error(line);
      break;
  }
}
