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
  const line = formatLogLine('info', message, context);
  if (typeof process !== 'undefined' && process.stdout) {
    process.stdout.write(line);
  } else {
    console.log(line.trimEnd());
  }
}

function logDevenvWarning(message, context) {
  const line = formatLogLine('warning', message, context);
  if (typeof process !== 'undefined' && process.stderr) {
    process.stderr.write(line);
  } else {
    console.error(line.trimEnd());
  }
}

export { logDevenvInfo, logDevenvWarning };
