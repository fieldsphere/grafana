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
  console.info(formatLogLine('info', message, context));
}

function logDevenvWarning(message, context) {
  console.warn(formatLogLine('warning', message, context));
}

module.exports = {
  logDevenvInfo,
  logDevenvWarning,
};

// ESM export support for k6 compatibility
export { logDevenvInfo, logDevenvWarning };
