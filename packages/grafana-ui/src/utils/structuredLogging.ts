type LogContext = Record<string, unknown>;

export function logUiWarning(message: string, context?: LogContext): void {
  if (context) {
    console.warn(message, context);
    return;
  }
  console.warn(message);
}

export function logUiError(message: string, context?: LogContext): void {
  if (context) {
    console.error(message, context);
    return;
  }
  console.error(message);
}

export function logUiDebug(message: string, context?: LogContext): void {
  if (context) {
    console.log(message, context);
    return;
  }
  console.log(message);
}
