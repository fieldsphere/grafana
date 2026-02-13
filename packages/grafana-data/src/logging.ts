import { logError, logWarning, type LogContext } from '@grafana/i18n';

export type { LogContext };

export function logDataWarning(message: string, context?: LogContext): void {
  logWarning(message, context);
}

export function logDataError(message: string, context?: LogContext): void {
  logError(message, context);
}
