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

function logE2eInfo(message, context) {
  process.stdout.write(formatLogLine(message, context));
}

function logE2eWarning(message, context) {
  process.stderr.write(formatLogLine(message, context));
}

function logE2eError(message, context) {
  process.stderr.write(formatLogLine(message, context));
}

module.exports = {
  logE2eInfo,
  logE2eWarning,
  logE2eError,
};
