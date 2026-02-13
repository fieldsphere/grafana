'use strict';

function formatLogLine(message, context) {
  if (context == null) {
    return `${message}\n`;
  }

  try {
    return `${message} ${JSON.stringify(context)}\n`;
  } catch (error) {
    return `${message} ${String(context)}\n`;
  }
}

function logScriptInfo(message, context) {
  process.stdout.write(formatLogLine(message, context));
}

function logScriptWarning(message, context) {
  process.stderr.write(formatLogLine(message, context));
}

function logScriptError(message, context) {
  process.stderr.write(formatLogLine(message, context));
}

module.exports = {
  logScriptInfo,
  logScriptWarning,
  logScriptError,
};
