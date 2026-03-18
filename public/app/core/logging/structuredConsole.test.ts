import type { MonitoringLogger } from '@grafana/runtime';

import { initStructuredConsoleLogging, logStructuredConsole, normalizeConsoleLog } from './structuredConsole';

function createMonitoringLoggerMock(): jest.Mocked<MonitoringLogger> {
  return {
    logDebug: jest.fn(),
    logInfo: jest.fn(),
    logWarning: jest.fn(),
    logError: jest.fn(),
    logMeasurement: jest.fn(),
  };
}

describe('normalizeConsoleLog', () => {
  it('uses the first string argument as the message and keeps remaining arguments in context', () => {
    const normalized = normalizeConsoleLog('warn', ['cache miss', { key: 'users' }]);

    expect(normalized).toMatchObject({
      message: 'cache miss',
      context: {
        console_level: 'warn',
        console_args: [{ key: 'users' }],
      },
    });
  });

  it('keeps Error instances for structured error logs', () => {
    const error = new Error('request failed');
    const normalized = normalizeConsoleLog('error', [error, { traceId: '123' }]);

    expect(normalized.error).toBe(error);
    expect(normalized.message).toBe('request failed');
    expect(normalized.context).toMatchObject({
      console_level: 'error',
      error_name: 'Error',
      console_args: [{ traceId: '123' }],
    });
  });

  it('serializes circular objects in console context', () => {
    const circularRef: Record<string, unknown> = { id: 1 };
    circularRef.self = circularRef;

    const normalized = normalizeConsoleLog('info', [circularRef]);
    const [serialized] = normalized.context.console_args as Array<Record<string, unknown>>;

    expect(serialized).toMatchObject({ id: 1, self: '[Circular]' });
  });
});

describe('logStructuredConsole', () => {
  it('maps each console level to the expected structured logger method', () => {
    const monitoringLogger = createMonitoringLoggerMock();

    logStructuredConsole('log', ['hello'], monitoringLogger);
    logStructuredConsole('warn', ['warn'], monitoringLogger);
    logStructuredConsole('debug', ['debug'], monitoringLogger);
    logStructuredConsole('trace', ['trace'], monitoringLogger);
    logStructuredConsole('error', ['error'], monitoringLogger);

    expect(monitoringLogger.logInfo).toHaveBeenCalledTimes(1);
    expect(monitoringLogger.logWarning).toHaveBeenCalledTimes(1);
    expect(monitoringLogger.logDebug).toHaveBeenCalledTimes(2);
    expect(monitoringLogger.logError).toHaveBeenCalledTimes(1);
  });

  it('converts non-error console.error payloads to Error objects', () => {
    const monitoringLogger = createMonitoringLoggerMock();

    logStructuredConsole('error', ['boom'], monitoringLogger);

    expect(monitoringLogger.logError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom' }),
      expect.objectContaining({ console_level: 'error' })
    );
  });
});

describe('initStructuredConsoleLogging', () => {
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    trace: console.trace,
  };

  beforeEach(() => {
    Reflect.deleteProperty(window, '__grafanaStructuredConsoleLoggingPatched__');
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
    console.trace = originalConsole.trace;
  });

  it('intercepts console calls and forwards them to monitoring logger', () => {
    const monitoringLogger = createMonitoringLoggerMock();
    const baseLog = jest.fn();
    const baseError = jest.fn();

    console.log = baseLog;
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = baseError;
    console.debug = jest.fn();
    console.trace = jest.fn();

    initStructuredConsoleLogging(monitoringLogger);

    console.log('hello', { id: 1 });
    console.error('boom');

    expect(monitoringLogger.logInfo).toHaveBeenCalledWith(
      'hello',
      expect.objectContaining({ console_level: 'log', console_args: [{ id: 1 }] })
    );
    expect(monitoringLogger.logError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom' }),
      expect.objectContaining({ console_level: 'error' })
    );
    expect(baseLog).toHaveBeenCalledWith('hello', { id: 1 });
    expect(baseError).toHaveBeenCalledWith('boom');
  });
});
