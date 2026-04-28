/**
 * Single-line JSON logs for browser console output (structured logging).
 * Uses console levels so devtools filtering still applies.
 *
 * @internal
 */
export type StructuredConsoleLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredConsolePayload extends Record<string, unknown> {
  level: StructuredConsoleLevel;
  message: string;
  source?: string;
}

function serializeUnknown(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      ...(value.stack ? { stack: value.stack } : {}),
    };
  }
  return value;
}

/**
 * Emits one JSON object per line to the appropriate console method.
 */
export function structuredConsoleLog(
  level: StructuredConsoleLevel,
  message: string,
  fields?: Record<string, unknown>
): void {
  const payload: StructuredConsolePayload = {
    level,
    message,
    ...(fields ? Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, serializeUnknown(v)])) : {}),
  };
  const line = JSON.stringify(payload);
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
