const logDebug = jest.fn();
const logError = jest.fn();
const logInfo = jest.fn();
const logWarning = jest.fn();

jest.mock('@grafana/runtime/unstable', () => ({
  getLogger: () => ({
    logDebug,
    logError,
    logInfo,
    logWarning,
  }),
}));

import { structuredLogger } from './structuredLogger';

describe('structuredLogger', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
    logDebug.mockClear();
    logError.mockClear();
    logInfo.mockClear();
    logWarning.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs info messages with serialized context', () => {
    structuredLogger.log('Loaded dashboard', { uid: 'abc' });

    expect(logInfo).toHaveBeenCalledWith('Loaded dashboard', { arg1: '{"uid":"abc"}' });
  });

  it('logs warnings through the monitoring logger', () => {
    structuredLogger.warn('Invalid response', 500);

    expect(logWarning).toHaveBeenCalledWith('Invalid response', { arg1: '500' });
  });

  it('normalizes non-error error logs to Error objects', () => {
    structuredLogger.error('Request failed', { status: 500 });

    expect(logError).toHaveBeenCalledWith(expect.any(Error), { arg1: '{"status":500}' });
    expect(logError.mock.calls[0][0].message).toBe('Request failed');
  });
});
