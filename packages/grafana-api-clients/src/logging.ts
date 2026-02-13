type LogContext = Record<string, unknown>;

export function logApiClientInfo(message: string, context?: LogContext): void {
  if (context) {
    console.log(message, context);
    return;
  }
  console.log(message);
}

export function logApiClientWarning(message: string, context?: LogContext): void {
  if (context) {
    console.warn(message, context);
    return;
  }
  console.warn(message);
}

export function logApiClientError(message: string, context?: LogContext): void {
  if (context) {
    console.error(message, context);
    return;
  }
  console.error(message);
}
