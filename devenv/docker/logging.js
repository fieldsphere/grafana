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
  const logLine = formatLogLine('info', message, context);
  if (typeof process !== 'undefined' && process.stdout) {
    process.stdout.write(logLine);
  } else {
    // k6 environment - use console API
    console.info(logLine.trim());
  }
}

function logDevenvWarning(message, context) {
  const logLine = formatLogLine('warning', message, context);
  if (typeof process !== 'undefined' && process.stderr) {
    process.stderr.write(logLine);
  } else {
    // k6 environment - use console API
    console.warn(logLine.trim());
  }
}

// ES module export for k6
export { logDevenvInfo, logDevenvWarning };

// CommonJS export for Node.js (using dynamic property assignment to avoid parse errors in k6)
const mod = typeof module !== 'undefined' ? module : null;
if (mod && typeof mod.exports !== 'undefined') {
  mod.exports = {
    logDevenvInfo,
    logDevenvWarning,
  };
}
