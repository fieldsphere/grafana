/**
 * Browser structured logging: forwards to the Grafana JavaScript agent (Faro) when
 * @grafana/runtime is loaded; otherwise no-ops. Use instead of console in application code.
 */

const noop = () => {};

/**
 * @public
 * Context passed to Faro log APIs; values are strings per Faro typing.
 */
export type ClientLogContext = Record<string, string>;

type StructuredLogImpl = {
  logInfo: (message: string, context?: ClientLogContext) => void;
  logWarning: (message: string, context?: ClientLogContext) => void;
  logDebug: (message: string, context?: ClientLogContext) => void;
  logError: (error: Error, context?: ClientLogContext) => void;
};

const noopImpl: StructuredLogImpl = {
  logInfo: noop,
  logWarning: noop,
  logDebug: noop,
  logError: noop,
};

let impl: StructuredLogImpl = noopImpl;

/**
 * Called from @grafana/runtime when the logging module loads.
 */
export function setClientStructuredLog(next: StructuredLogImpl) {
  impl = next;
}

/**
 * @public
 * @internal — exposed for the console-to-structured codemod.
 */
export function formatClientLogArgs(args: readonly unknown[]): string {
  if (args.length === 0) {
    return '';
  }
  return args.map((a) => formatOneArg(a)).join(' ');
}

function formatOneArg(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return String(value);
  }
  if (value instanceof Error) {
    return value.stack || value.message;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function ctxFor(source: string, extra?: ClientLogContext): ClientLogContext {
  if (extra) {
    return { source, ...extra };
  }
  return { source: source || 'grafana' };
}

function withMessageSource(source: string, message: string) {
  return source ? `${source}: ${message}` : message;
}

/**
 * @public
 * Structured replacement for `console.log` / `console.info` (and similar).
 */
export function clientStructuredInfo(source: string, ...args: unknown[]) {
  const message = formatClientLogArgs(args);
  impl.logInfo(withMessageSource(source, message), ctxFor(source));
}

/**
 * @public
 * Structured replacement for `console.debug`.
 */
export function clientStructuredDebug(source: string, ...args: unknown[]) {
  const message = formatClientLogArgs(args);
  impl.logDebug(withMessageSource(source, message), ctxFor(source));
}

/**
 * @public
 * Structured replacement for `console.warn`.
 */
export function clientStructuredWarn(source: string, ...args: unknown[]) {
  const message = formatClientLogArgs(args);
  impl.logWarning(withMessageSource(source, message), ctxFor(source));
}

/**
 * @public
 * Structured replacement for `console.error`.
 */
export function clientStructuredError(source: string, ...args: unknown[]) {
  if (args.length === 1 && args[0] instanceof Error) {
    impl.logError(args[0], ctxFor(source));
    return;
  }
  const message = formatClientLogArgs(args);
  impl.logError(new Error(message), ctxFor(source));
}

/**
 * Binds a stable source string (e.g. module or component id) to structured log methods.
 * Prefer this over `console` in app code.
 *
 * @public
 */
export function createClientLog(source: string) {
  return {
    info: (...args: unknown[]) => clientStructuredInfo(source, ...args),
    debug: (...args: unknown[]) => clientStructuredDebug(source, ...args),
    warn: (...args: unknown[]) => clientStructuredWarn(source, ...args),
    error: (...args: unknown[]) => clientStructuredError(source, ...args),
  };
}

export type { StructuredLogImpl };
