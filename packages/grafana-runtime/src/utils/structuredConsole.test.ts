import { structuredConsoleLog } from './structuredConsole';

describe('structuredConsoleLog', () => {
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('writes JSON with info level to console.log', () => {
    structuredConsoleLog('info', 'hello', { source: 'test', key: 'value' });
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(logSpy.mock.calls[0][0]))).toEqual({
      level: 'info',
      message: 'hello',
      source: 'test',
      key: 'value',
    });
  });

  it('serializes Error fields', () => {
    const err = new Error('boom');
    structuredConsoleLog('error', 'failed', { source: 'test', error: err });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(String(errorSpy.mock.calls[0][0]));
    expect(parsed.level).toBe('error');
    expect(parsed.message).toBe('failed');
    expect(parsed.source).toBe('test');
    expect(parsed.error).toMatchObject({ name: 'Error', message: 'boom' });
    expect(typeof parsed.error.stack).toBe('string');
  });
});
