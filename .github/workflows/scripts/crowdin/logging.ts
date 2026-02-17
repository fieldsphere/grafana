type LogContext = Record<string, unknown>

function formatLogLine(level: 'info' | 'error', message: string, context?: LogContext): string {
  const payload = {
    level,
    message,
    ...(context != null ? { context } : {}),
  }

  try {
    return `${JSON.stringify(payload)}\n`
  } catch {
    return `${JSON.stringify({ level, message, context: String(context) })}\n`
  }
}

export function logCrowdinInfo(message: string, context?: LogContext) {
  process.stdout.write(formatLogLine('info', message, context))
}

export function logCrowdinError(message: string, context?: LogContext) {
  process.stderr.write(formatLogLine('error', message, context))
}
