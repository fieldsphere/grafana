type LogContext = Record<string, unknown>;

function emit(level: 'log' | 'warn' | 'error', message: string, context?: LogContext): void {
  const sink = globalThis.console as Partial<Record<'log' | 'warn' | 'error', (...args: unknown[]) => void>> | undefined;
  if (!sink?.[level]) {
    return;
  }

  if (context) {
    sink[level]!(message, context);
    return;
  }

  sink[level]!(message);
}

export function logApiClientInfo(message: string, context?: LogContext): void {
  emit('log', message, context);
}

export function logApiClientWarning(message: string, context?: LogContext): void {
  emit('warn', message, context);
}

export function logApiClientError(message: string, context?: LogContext): void {
  emit('error', message, context);
}
