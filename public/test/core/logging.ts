type LogContext = Record<string, unknown>;

function formatLogLine(level: 'debug', message: string, context?: LogContext): string {
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

export function logTestDebug(message: string, context?: LogContext) {
  process.stdout.write(formatLogLine('debug', message, context));
}
