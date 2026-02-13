'use strict';

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

function logCodeownersInfo(message, context) {
  process.stdout.write(formatLogLine('info', message, context));
}

function logCodeownersError(message, context) {
  process.stderr.write(formatLogLine('error', message, context));
}

module.exports = {
  logCodeownersInfo,
  logCodeownersError,
};
