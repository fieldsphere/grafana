import { createStructuredLogger, defaultLogSink, resetLogSink, setLogSink, type LogRecord } from './logger';

describe('createStructuredLogger', () => {
  afterEach(() => {
    resetLogSink();
  });

  it('sends level, source, and message to the sink', () => {
    const records: LogRecord[] = [];
    setLogSink((record) => records.push(record));

    createStructuredLogger('grafana/data').warn('something went wrong');

    expect(records).toEqual([
      {
        level: 'warn',
        source: 'grafana/data',
        message: 'something went wrong',
        remote: true,
      },
    ]);
  });

  it('captures an Error and a plain object as serialized context', () => {
    const records: LogRecord[] = [];
    setLogSink((record) => records.push(record));

    const err = new Error('boom');
    createStructuredLogger('features.scopes').error('Failed to load node', err, { id: 'n1', count: 2 });

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      level: 'error',
      source: 'features.scopes',
      message: 'Failed to load node',
      error: err,
      remote: true,
      context: { id: 'n1', count: '2' },
    });
    expect(records[0].rawContext).toEqual({ id: 'n1', count: 2 });
  });

  it('serializes circular context values instead of throwing', () => {
    const records: LogRecord[] = [];
    setLogSink((record) => records.push(record));
    const value: Record<string, unknown> = { spanID: '123' };
    value.self = value;

    createStructuredLogger('grafana/ui').warn('Cannot render tooltip value', { value });

    expect(records[0].context).toEqual({ value: '[object Object]' });
    expect(records[0].rawContext).toEqual({ value });
  });

  it('marks local-only loggers as not remote', () => {
    const records: LogRecord[] = [];
    setLogSink((record) => records.push(record));

    createStructuredLogger('grafana/data', { remote: false }).warn('Can not convert', { payload: 'secret' });

    expect(records[0].remote).toBe(false);
    expect(records[0].context).toEqual({ payload: 'secret' });
  });

  it('uses the error message when the only argument is an Error', () => {
    const records: LogRecord[] = [];
    setLogSink((record) => records.push(record));
    const err = new Error('device id failed');

    createStructuredLogger('features.core').error(err);

    expect(records[0].message).toBe('device id failed');
    expect(records[0].error).toBe(err);
  });

  it('default sink writes the message, source, and raw context to the console', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    const error = jest.spyOn(console, 'error').mockImplementation();
    setLogSink(defaultLogSink);
    const err = new Error('boom');

    createStructuredLogger('grafana/ui').warn('Unknown stats');
    createStructuredLogger('grafana/ui').error('plugin failed', err, { pluginId: 'clock' });

    expect(warn).toHaveBeenCalledWith('Unknown stats', { source: 'grafana/ui' });
    expect(error).toHaveBeenCalledWith('plugin failed', { source: 'grafana/ui', pluginId: 'clock' }, err);
    warn.mockRestore();
    error.mockRestore();
  });

  it('falls back to console.error when the sink throws', () => {
    const error = jest.spyOn(console, 'error').mockImplementation();
    setLogSink(() => {
      throw new Error('sink down');
    });

    createStructuredLogger('grafana/data').info('hello');

    expect(error).toHaveBeenCalledWith('Structured logger sink failed', expect.any(Error));
    error.mockRestore();
  });
});
