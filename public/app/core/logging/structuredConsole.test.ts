import type { MonitoringLogger } from '@grafana/runtime';

import { logStructuredConsole, normalizeConsoleLog } from './structuredConsole';

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
