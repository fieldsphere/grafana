import { createStructuredConsole, installStructuredConsole } from './structuredConsole';
import { MonitoringLogger } from './logging';

const mockMonitoringLogger: MonitoringLogger = {
  logDebug: jest.fn(),
  logError: jest.fn(),
  logInfo: jest.fn(),
  logMeasurement: jest.fn(),
  logWarning: jest.fn(),
};

jest.mock('./logging', () => ({
  createMonitoringLogger: jest.fn(() => mockMonitoringLogger),
}));

jest.mock('../config', () => ({
  config: {
    buildInfo: {
      env: 'production',
    },
  },
}));

describe('structuredConsole', () => {
  const structuredConsoleKey = '__grafanaStructuredConsole';

  beforeEach(() => {
    jest.clearAllMocks();
    Reflect.deleteProperty(globalThis, structuredConsoleKey);
  });

  test('sends warning logs with a structured payload', () => {
    const structuredConsole = createStructuredConsole();

    structuredConsole.warn('warning message', { userId: 7 });

    expect(mockMonitoringLogger.logWarning).toHaveBeenCalledWith(
      'warning message',
      expect.objectContaining({
        console: expect.objectContaining({
          level: 'warn',
          message: 'warning message',
          args: ['warning message', { userId: 7 }],
          timestamp: expect.any(String),
        }),
      })
    );
  });

  test('converts error arguments into Error instances', () => {
    const structuredConsole = createStructuredConsole();
    const originalError = new Error('boom');

    structuredConsole.error(originalError, { feature: 'alerts' });

    expect(mockMonitoringLogger.logError).toHaveBeenCalledTimes(1);

    const [loggedError, context] = (mockMonitoringLogger.logError as jest.Mock).mock.calls[0];
    expect(loggedError).toBeInstanceOf(Error);
    expect(loggedError.message).toBe('boom');
    expect(context).toEqual(
      expect.objectContaining({
        console: expect.objectContaining({
          level: 'error',
          message: 'boom',
        }),
      })
    );
  });

  test('installs only once and reuses an existing structured console', () => {
    const first = installStructuredConsole();
    const second = installStructuredConsole({
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
    });

    expect(second).toBe(first);
    expect(Reflect.get(globalThis, structuredConsoleKey)).toBe(first);
  });
});
