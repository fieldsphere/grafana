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

function logDevenvInfo(message, context) {
  if (typeof process !== 'undefined' && process.stdout) {
    process.stdout.write(formatLogLine('info', message, context));
  }
}

function logDevenvWarning(message, context) {
  if (typeof process !== 'undefined' && process.stderr) {
    process.stderr.write(formatLogLine('warning', message, context));
  }
}

module.exports = {
  logDevenvInfo,
  logDevenvWarning,
};
