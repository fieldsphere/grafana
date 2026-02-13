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

function logScriptInfo(message, context) {
  process.stdout.write(formatLogLine('info', message, context));
}

function logScriptWarning(message, context) {
  process.stderr.write(formatLogLine('warning', message, context));
}

function logScriptError(message, context) {
  process.stderr.write(formatLogLine('error', message, context));
}

module.exports = {
  logScriptInfo,
  logScriptWarning,
  logScriptError,
};
