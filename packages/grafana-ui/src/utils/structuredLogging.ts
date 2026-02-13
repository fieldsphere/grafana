import { logDebug, logError, logWarning, type LogContext } from '@grafana/i18n';

export type { LogContext };

export function logUiWarning(message: string, context?: LogContext): void {
  logWarning(message, context);
}

export function logUiError(message: string, context?: LogContext): void {
  logError(message, context);
}

export function logUiDebug(message: string, context?: LogContext): void {
  logDebug(message, context);
}
