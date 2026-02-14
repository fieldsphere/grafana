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

function logE2eInfo(message, context) {
  process.stdout.write(formatLogLine('info', message, context));
}

module.exports = {
  logE2eInfo,
};
