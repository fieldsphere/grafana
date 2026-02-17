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

export function logDevenvWarning(message, context) {
  console.error(formatLogLine('warning', message, context));
}
