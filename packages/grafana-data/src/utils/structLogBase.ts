const isJest = typeof process !== 'undefined' && process.env && process.env.JEST_WORKER_ID;
const isProd =
  typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production' && !isJest;

export type StructLogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

/**
 * Structured app logging: routes to the console in development and in tests, with production
 * noise reduced for `log` / `info` / `debug` while keeping `warn` / `error` visible.
 * Prefer this over `console.*` in application code. When the Grafana JavaScript agent is
 * enabled, `logInfo` and related helpers in `@grafana/runtime` also forward to Faro.
 *
 * @public
 */
export function structLog(level: StructLogLevel, ...args: unknown[]): void {
  if (isProd && (level === 'log' || level === 'info' || level === 'debug')) {
    return;
  }
  const debugFn = console.debug ? console.debug.bind(console) : console.log.bind(console);
  switch (level) {
    case 'error':
      console.error(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    case 'debug':
      debugFn(...args);
      break;
    case 'log':
    case 'info':
    default:
      console.log(...args);
      break;
  }
}
