const mockPushLog = jest.fn();
const mockPushError = jest.fn();
const mockPushMeasurement = jest.fn();

jest.mock('@grafana/faro-web-sdk', () => ({
  faro: {
    api: {
      pushLog: mockPushLog,
      pushError: mockPushError,
      pushMeasurement: mockPushMeasurement,
    },
  },
  LogLevel: {
    INFO: 'info',
    WARN: 'warn',
    DEBUG: 'debug',
  },
}));

import { config } from '../config';

import { installConsoleStructuredLogging, uninstallConsoleStructuredLogging } from './logging';

describe('console structured logging bridge', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAgentEnabled = config.grafanaJavascriptAgent.enabled;
  const originalConsoleInstrumentalizationEnabled = config.grafanaJavascriptAgent.consoleInstrumentalizationEnabled;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    config.grafanaJavascriptAgent.enabled = true;
    config.grafanaJavascriptAgent.consoleInstrumentalizationEnabled = false;

    mockPushLog.mockReset();
    mockPushError.mockReset();
    mockPushMeasurement.mockReset();

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'trace').mockImplementation(() => {});

    uninstallConsoleStructuredLogging();
  });

  afterEach(() => {
    uninstallConsoleStructuredLogging();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    config.grafanaJavascriptAgent.enabled = originalAgentEnabled;
    config.grafanaJavascriptAgent.consoleInstrumentalizationEnabled = originalConsoleInstrumentalizationEnabled;
  });

  it('forwards warn logs with structured context', () => {
    installConsoleStructuredLogging();

    console.warn('request failed', { status: 500 });

    expect(mockPushLog).toHaveBeenCalledTimes(1);
    expect(mockPushLog).toHaveBeenCalledWith(
      ['request failed {"status":500}'],
      expect.objectContaining({
        level: 'warn',
        context: expect.objectContaining({
          source: 'browser.console',
          method: 'warn',
          args: ['request failed', { status: 500 }],
        }),
      })
    );
  });

  it('forwards errors using the error signal', () => {
    installConsoleStructuredLogging();

    const err = new Error('boom');
    console.error('operation failed', err);

    expect(mockPushError).toHaveBeenCalledTimes(1);
    expect(mockPushError).toHaveBeenCalledWith(
      err,
      expect.objectContaining({
        context: expect.objectContaining({
          source: 'browser.console',
          method: 'error',
          args: ['operation failed', { name: 'Error', message: 'boom', stack: err.stack }],
        }),
      })
    );
  });

  it('does not install when Faro console instrumentation is enabled', () => {
    config.grafanaJavascriptAgent.consoleInstrumentalizationEnabled = true;
    installConsoleStructuredLogging();

    console.warn('request failed', { status: 500 });

    expect(mockPushLog).not.toHaveBeenCalled();
    expect(mockPushError).not.toHaveBeenCalled();
  });
});
