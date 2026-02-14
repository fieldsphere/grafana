type LogContext = Record<string, unknown>;

function emit(level: 'log' | 'warn' | 'error', message: string, context?: LogContext): void {
  const sink = globalThis.console as Partial<Record<'log' | 'warn' | 'error', (...args: unknown[]) => void>> | undefined;
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

export function logApiClientInfo(message: string, context?: LogContext): void {
  emit('log', message, context);
}

export function logApiClientWarning(message: string, context?: LogContext): void {
  emit('warn', message, context);
}

export function logApiClientError(message: string, context?: LogContext): void {
  emit('error', message, context);
}
