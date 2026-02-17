type LogContext = Record<string, unknown>;

function formatLogLine(level: 'info', message: string, context?: LogContext): string {
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

export function logDataScriptInfo(message: string, context?: LogContext) {
  process.stdout.write(formatLogLine('info', message, context));
}
