import { createStructuredLogger, defaultLogSink, resetLogSink, setLogSink, type LogRecord } from './logger';

describe('createStructuredLogger', () => {
  afterEach(() => {
    resetLogSink();
  });

  it('sends level, source, and string message to the sink', () => {
    const records: LogRecord[] = [];
    setLogSink((record) => records.push(record));

    const logger = createStructuredLogger('grafana/data');

    logger.warn('something went wrong');

    expect(records).toEqual([
      {
        level: 'warn',
        source: 'grafana/data',
        message: 'something went wrong',
        error: undefined,
        context: undefined,
      },
    ]);
  });

  it('captures Error instances and remaining args as context', () => {
    const records: LogRecord[] = [];
    setLogSink((record) => records.push(record));

    const err = new Error('boom');
    const logger = createStructuredLogger('features.scopes');

    logger.error('Failed to load node', err, { id: 'n1' });

    expect(records).toHaveLength(1);
    expect(records[0].level).toBe('error');
    expect(records[0].source).toBe('features.scopes');
    expect(records[0].error).toBe(err);
    expect(records[0].message).toBe('Failed to load node');
    expect(records[0].context).toEqual({ id: 'n1' });
  });

  it('default sink writes to console with a source tag', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    setLogSink(defaultLogSink);

    createStructuredLogger('grafana/ui').warn('Unknown stats');

    expect(warn).toHaveBeenCalledWith('Unknown stats', { source: 'grafana/ui' });
    warn.mockRestore();
  });
});
