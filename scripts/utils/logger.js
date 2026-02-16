#!/usr/bin/env node

/**
 * Structured logger for Node.js scripts.
 * Outputs JSON-formatted log entries for consistent, parseable logging.
 *
 * @example
 * const logger = createLogger('script-name');
 * logger.info('Processing started', { fileCount: 5 });
 * logger.error('Failed to read file', { path: '/tmp/file', error: err.message });
 */

/**
 * @param {string} source - Identifier for the source of the log messages
 * @returns {{ info: Function, warn: Function, error: Function, debug: Function }}
 */
function createLogger(source) {
  const formatEntry = (level, message, context = {}) => {
    return JSON.stringify({
      level,
      source,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    });
  };

  return {
    info: (message, context) => {
      process.stdout.write(formatEntry('info', message, context) + '\n');
    },
    warn: (message, context) => {
      process.stderr.write(formatEntry('warn', message, context) + '\n');
    },
    error: (message, context) => {
      process.stderr.write(formatEntry('error', message, context) + '\n');
    },
    debug: (message, context) => {
      if (process.env.DEBUG) {
        process.stdout.write(formatEntry('debug', message, context) + '\n');
      }
    },
  };
}

module.exports = { createLogger };
