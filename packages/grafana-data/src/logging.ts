export type LogContext = Record<string, unknown>;

export function emit(level: 'log' | 'warn' | 'error', message: string, context?: LogContext): void {
  const sink = globalThis.console as Partial<Record<'log' | 'warn' | 'error', (...args: unknown[]) => void>> | undefined;
  const method = sink?.[level];
  if (!method) {
    return;
  }

  if (context) {
    method(message, context);
    return;
  }

  method(message);
}

export function logDataWarning(message: string, context?: LogContext): void {
  emit('warn', message, context);
}

export function logDataError(message: string, context?: LogContext): void {
  emit('error', message, context);
}
