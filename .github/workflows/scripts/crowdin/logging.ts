type LogContext = Record<string, unknown>

function formatLogLine(message: string, context?: LogContext): string {
  if (context == null) {
    return `${message}\n`
  }

  try {
    return `${message} ${JSON.stringify(context)}\n`
  } catch {
    return `${message} ${String(context)}\n`
  }
}

export function logCrowdinInfo(message: string, context?: LogContext) {
  process.stdout.write(formatLogLine(message, context))
}

export function logCrowdinError(message: string, context?: LogContext) {
  process.stderr.write(formatLogLine(message, context))
}
