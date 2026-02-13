type LogContext = Record<string, unknown>;

export function logDataWarning(message: string, context?: LogContext): void {
  if (context) {
    console.warn(message, context);
    return;
  }
  console.warn(message);
}

export function logDataError(message: string, context?: LogContext): void {
  if (context) {
    console.error(message, context);
    return;
  }
  console.error(message);
}
