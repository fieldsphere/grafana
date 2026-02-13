type LogContext = Record<string, unknown>;

function emit(level: 'warn' | 'error', message: string, context?: LogContext): void {
  const sink = globalThis.console as Partial<Record<'warn' | 'error', (...args: unknown[]) => void>> | undefined;
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
