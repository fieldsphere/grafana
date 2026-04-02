function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function serializeValue(value, seen = new WeakSet()) {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Error) {
    const serializedError = {
      name: value.name,
      message: value.message,
    };

    if (value.stack) {
      serializedError.stack = value.stack;
    }

    if ('cause' in value && value.cause !== undefined) {
      serializedError.cause = serializeValue(value.cause, seen);
    }

    return serializedError;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item, seen));
  }

  switch (typeof value) {
    case 'bigint':
      return value.toString();
    case 'boolean':
    case 'number':
    case 'string':
      return value;
    case 'function':
      return `[Function ${value.name || 'anonymous'}]`;
    case 'symbol':
      return value.toString();
    case 'object': {
      if (seen.has(value)) {
        return '[Circular]';
      }

      seen.add(value);

      if (value instanceof Date) {
        return value.toISOString();
      }

      const output = {};
      for (const [key, nestedValue] of Object.entries(value)) {
        output[key] = serializeValue(nestedValue, seen);
      }

      return output;
    }
    default:
      return String(value);
  }
}

function escapeLogfmtValue(value) {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function formatLogfmtField(key, value) {
  if (value === null) {
    return `${key}=null`;
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return `${key}=${value}`;
  }

  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  return `${key}="${escapeLogfmtValue(stringValue)}"`;
}

function formatLogEntry(entry) {
  const parts = [
    formatLogfmtField('ts', entry.ts),
    formatLogfmtField('level', entry.level),
    formatLogfmtField('source', entry.source),
    formatLogfmtField('msg', entry.msg),
  ];

  if (entry.context !== undefined) {
    parts.push(formatLogfmtField('context', entry.context));
  }

  if (entry.args !== undefined) {
    parts.push(formatLogfmtField('args', entry.args));
  }

  return parts.join(' ');
}

function normalizeArguments(args) {
  if (args.length === 0) {
    return { msg: 'Structured log event' };
  }

  const [first, ...rest] = args;

  if (typeof first === 'string') {
    if (rest.length === 1 && (isPlainObject(rest[0]) || rest[0] instanceof Error)) {
      return {
        msg: first,
        context: serializeValue(rest[0]),
      };
    }

    return {
      msg: first,
      args: rest.length > 0 ? serializeValue(rest) : undefined,
    };
  }

  if (first instanceof Error) {
    return {
      msg: first.message,
      context: serializeValue(first),
      args: rest.length > 0 ? serializeValue(rest) : undefined,
    };
  }

  if (args.length === 1 && isPlainObject(first)) {
    return {
      msg: 'Structured log event',
      context: serializeValue(first),
    };
  }

  return {
    msg: 'Structured log event',
    args: serializeValue(args),
  };
}

function getConsoleMethod(method) {
  const consoleRef = globalThis.console;

  if (!consoleRef) {
    return () => {};
  }

  const targetMethod = consoleRef[method];
  if (typeof targetMethod === 'function') {
    return targetMethod.bind(consoleRef);
  }

  return consoleRef.log.bind(consoleRef);
}

function now() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
}

function write(level, source, args) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    source,
    ...normalizeArguments(args),
  };

  const method =
    level === 'error' ? 'error' : level === 'warn' ? 'warn' : level === 'debug' ? 'debug' : level === 'trace' ? 'trace' : 'info';

  getConsoleMethod(method)(formatLogEntry(entry));
}

function createStructuredLogger(source) {
  const timers = new Map();

  return {
    log: (...args) => write('info', source, args),
    info: (...args) => write('info', source, args),
    warn: (...args) => write('warn', source, args),
    error: (...args) => write('error', source, args),
    debug: (...args) => write('debug', source, args),
    trace: (...args) => write('trace', source, args),
    groupCollapsed: (...args) => write('debug', source, ['Structured log group start', ...args]),
    groupEnd: () => write('debug', source, ['Structured log group end']),
    time: (label) => {
      timers.set(label, now());
    },
    timeEnd: (label) => {
      const start = timers.get(label);

      if (start === undefined) {
        write('warn', source, ['Structured log timer finished without a matching start', { label }]);
        return;
      }

      timers.delete(label);
      write('debug', source, ['Structured log timer completed', { label, durationMs: Number((now() - start).toFixed(3)) }]);
    },
  };
}

module.exports = { createStructuredLogger };
