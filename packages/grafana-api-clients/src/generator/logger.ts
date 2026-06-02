type StructuredLogLevel = 'debug' | 'info' | 'warn' | 'error';

function writeStructuredLog(source: string, level: StructuredLogLevel, args: unknown[]): void {
  const [message, ...context] = args;
  const logFn = globalThis.console?.[level] ?? globalThis.console?.log;

  logFn?.({
    level,
    message: typeof message === 'string' ? message : String(message),
    source,
    ...(context.length > 0 && { context }),
  });
}

export function createStructuredLogger(source: string) {
  return {
    info: (...args: unknown[]) => writeStructuredLog(source, 'info', args),
    warn: (...args: unknown[]) => writeStructuredLog(source, 'warn', args),
    error: (...args: unknown[]) => writeStructuredLog(source, 'error', args),
  };
}
