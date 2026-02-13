import { emit, type LogContext } from '@grafana/data';

export function logUiWarning(message: string, context?: LogContext): void {
  emit('warn', message, context);
}

export function logUiError(message: string, context?: LogContext): void {
  emit('error', message, context);
}

export function logUiDebug(message: string, context?: LogContext): void {
  emit('log', message, context);
}
