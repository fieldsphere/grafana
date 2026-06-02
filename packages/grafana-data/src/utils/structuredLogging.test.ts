import { logError, logInfo } from './structuredLogging';

describe('structuredLogging', () => {
  let infoSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(globalThis.console, 'info').mockImplementation();
    errorSpy = jest.spyOn(globalThis.console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs info records with structured context', () => {
    logInfo('message', { id: 1 });

    expect(infoSpy).toHaveBeenCalledWith({
      level: 'info',
      message: 'message',
      timestamp: expect.any(String),
      context: { args: [{ id: 1 }] },
    });
  });

  it('serializes errors for structured context', () => {
    const err = new Error('failed');

    logError(err);

    expect(errorSpy).toHaveBeenCalledWith({
      level: 'error',
      message: 'failed',
      timestamp: expect.any(String),
    });
  });
});
