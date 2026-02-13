export type LogContext = Record<string, unknown>;

function logError(message: string, context?: LogContext): void {
  if (context) {
    console.error(message, context);
    return;
  }
  console.error(message);
}

function logWarning(message: string, context?: LogContext): void {
  if (context) {
    console.warn(message, context);
    return;
  }
  console.warn(message);
}

function logDebug(message: string, context?: LogContext): void {
  if (context) {
    console.log(message, context);
    return;
  }
  console.log(message);
}

export function logI18nError(message: string, context?: LogContext): void {
  logError(message, context);
}

export function logI18nWarning(message: string, context?: LogContext): void {
  logWarning(message, context);
}

// Export shared utilities for use by other packages
export { logError, logWarning, logDebug };
