type LogContext = Record<string, unknown>;

function emit(level: 'warn' | 'error', message: string, context?: LogContext): void {
  const sink = globalThis.console as Partial<Record<'warn' | 'error', (...args: unknown[]) => void>> | undefined;
  const method = sink?.[level];
  if (!method) {
    return;
  }

  if (context) {
    method.call(sink, message, context);
    return;
  }

  method.call(sink, message);
}

export function logI18nError(message: string, context?: LogContext): void {
  emit('error', message, context);
}

export function logI18nWarning(message: string, context?: LogContext): void {
  emit('warn', message, context);
}
