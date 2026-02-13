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

function logCodeownersInfo(message, context) {
  process.stdout.write(formatLogLine(message, context));
}

function logCodeownersError(message, context) {
  process.stderr.write(formatLogLine(message, context));
}

module.exports = {
  logCodeownersInfo,
  logCodeownersError,
};
