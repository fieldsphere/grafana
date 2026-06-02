function serializeValue(value) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  return value;
}

function getMessage(message) {
  if (typeof message === 'string') {
    return message;
  }

  if (message instanceof Error) {
    return message.message;
  }

  try {
    const serialized = JSON.stringify(message);
    return serialized === undefined ? String(message) : serialized;
  } catch {
    return String(message);
  }
}

function emitStructuredLog(level, message, ...args) {
  const record = {
    level,
    message: getMessage(message),
    timestamp: new Date().toISOString(),
  };

  const serializedArgs = args.map(serializeValue);
  if (serializedArgs.length > 0) {
    record.context = { args: serializedArgs };
  }

  process.stdout.write(`${JSON.stringify(record)}\n`);
}

function logInfo(message, ...args) {
  emitStructuredLog('info', message, ...args);
}

module.exports = {
  emitStructuredLog,
  logInfo,
};
