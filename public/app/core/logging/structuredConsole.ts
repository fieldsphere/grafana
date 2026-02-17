import { config, logError, logInfo, logWarning } from '@grafana/runtime';

type ConsoleLevel = 'log' | 'info' | 'warn' | 'error';

/**
 * Converts console.* calls to structured logging using Grafana's logging infrastructure.
 *
 * @param level - The console method level ('log'|'info'|'warn'|'error')
 * @param args - Original arguments passed to console.*
 */
export function structuredLogFromConsole(level: ConsoleLevel, ...args: unknown[]): void {
  if (args.length === 0) {
    return;
  }

  if (!config.grafanaJavascriptAgent.enabled) {
    console[level](...args);
    return;
  }

  // Extract message: first string arg if present, else default
  const firstArg = args[0];
  const message = typeof firstArg === 'string' ? firstArg : `console.${level}`;

  // Separate string and non-string args for context
  const stringArgs: string[] = [];
  const nonStringArgs: unknown[] = [];

  for (const arg of args) {
    if (typeof arg === 'string') {
      stringArgs.push(arg);
    } else {
      nonStringArgs.push(arg);
    }
  }

  // Build context object
  const context: Record<string, unknown> = {};
  if (nonStringArgs.length > 0) {
    context.args = nonStringArgs;
  }
  if (stringArgs.length > 1) {
    context.stringArgs = stringArgs.slice(1);
  }
  if (typeof firstArg === 'string') {
    context.consoleMessage = firstArg;
  }

  // Route to appropriate structured logger
  switch (level) {
    case 'log':
    case 'info':
      logInfo(message, context);
      break;
    case 'warn':
      logWarning(message, context);
      break;
    case 'error': {
      // For error level, check if an Error exists in args
      const errorArg = args.find((arg): arg is Error => arg instanceof Error);
      if (errorArg) {
        logError(errorArg, context);
      } else {
        const objectArg = args.find((arg): arg is Record<string, unknown> => typeof arg === 'object' && arg !== null);
        if (objectArg) {
          logError(objectArg as Error, context);
          break;
        }

        const primitiveArg = args.find((arg) => typeof arg !== 'string');
        const error = new Error(primitiveArg !== undefined ? String(primitiveArg) : message);
        logError(error, context);
      }
      break;
    }
  }
}
