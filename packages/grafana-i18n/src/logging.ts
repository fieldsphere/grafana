type LogContext = Record<string, unknown>;

function emit(level: 'warn' | 'error', message: string, context?: LogContext): void {
  const sink = globalThis.console as Partial<Record<'warn' | 'error', (...args: unknown[]) => void>> | undefined;
  if (!sink?.[level]) {
    return;
  }

  if (context) {
    sink[level]!(message, context);
    return;
  }

  sink[level]!(message);
}

export function logI18nError(message: string, context?: LogContext): void {
  emit('error', message, context);
}

export function logI18nWarning(message: string, context?: LogContext): void {
  emit('warn', message, context);
}
