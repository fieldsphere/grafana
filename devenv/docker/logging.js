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
  process.stdout.write(formatLogLine('info', message, context));
}

function logDevenvWarning(message, context) {
  process.stderr.write(formatLogLine('warning', message, context));
}

// CommonJS export for backward compatibility
module.exports = {
  logDevenvInfo,
  logDevenvWarning,
};

// ESM export for k6 loadtest modules
export { logDevenvInfo, logDevenvWarning };
