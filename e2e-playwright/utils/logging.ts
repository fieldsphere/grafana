type LogContext = Record<string, unknown>;

function formatLogLine(level: 'info' | 'warning' | 'error', message: string, context?: LogContext): string {
  const payload = {
    level,
    message,
    ...(context != null ? { context } : {}),
  };

  try {
    return `${JSON.stringify(payload)}\n`;
  } catch {
    return `${JSON.stringify({ level, message, context: String(context) })}\n`;
  }
}

export function logPlaywrightInfo(message: string, context?: LogContext) {
  process.stdout.write(formatLogLine('info', message, context));
}

export function logPlaywrightWarning(message: string, context?: LogContext) {
  process.stderr.write(formatLogLine('warning', message, context));
}

export function logPlaywrightError(message: string, context?: LogContext) {
  process.stderr.write(formatLogLine('error', message, context));
}
