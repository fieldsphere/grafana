function formatLogLine(level, message, context) {
  const payload = {
    level,
    message,
    ...(context != null ? { context } : {}),
  };

  try {
    return `${JSON.stringify(payload)}\n`;
  } catch (error) {
    return `${JSON.stringify({ level, message, context: String(context) })}\n`;
  }
}

export function logDevenvInfo(message, context) {
  process.stdout.write(formatLogLine('info', message, context));
}

export function logDevenvWarning(message, context) {
  process.stderr.write(formatLogLine('warning', message, context));
}
