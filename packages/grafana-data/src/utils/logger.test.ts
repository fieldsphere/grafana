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

  it('keeps fetch error request bodies and response payloads out of remote context', () => {
    const records: LogRecord[] = [];
    setLogSink((record) => records.push(record));

    const fetchError = {
      status: 400,
      statusText: 'Bad Request',
      data: { message: 'invalid password', sessionToken: 'response-secret' },
      config: {
        url: '/api/user/password?access_token=query-secret',
        method: 'PUT',
        headers: { Authorization: 'Bearer header-secret' },
        data: { oldPassword: 'admin', newPassword: 'hunter2' },
        params: { token: 'param-secret' },
      },
      traceId: 'trace-1',
    };
    const absoluteFetchError = {
      ...fetchError,
      config: {
        ...fetchError.config,
        url: 'https://user:pass@example.com/api/user/password?access_token=query-secret',
      },
    };

    createStructuredLogger('features.core').error(fetchError);
    createStructuredLogger('features.actions').error('API call error', fetchError);
    createStructuredLogger('features.actions').error('API call error', fetchError, { requestId: 'req-1' });
    createStructuredLogger('features.core').error(absoluteFetchError);

    const remoteText = JSON.stringify(records.map((record) => ({ message: record.message, context: record.context })));
    expect(remoteText).not.toContain('hunter2');
    expect(remoteText).not.toContain('admin');
    expect(remoteText).not.toContain('header-secret');
    expect(remoteText).not.toContain('query-secret');
    expect(remoteText).not.toContain('param-secret');
    expect(remoteText).not.toContain('response-secret');
    expect(remoteText).not.toContain('pass@');

    expect(records[0].message).toBe(
      '{"status":400,"statusText":"Bad Request","traceId":"trace-1","config":{"url":"/api/user/password","method":"PUT"}}'
    );
    expect(records[0].context).toEqual({
      status: '400',
      statusText: 'Bad Request',
      traceId: 'trace-1',
      config: '{"url":"/api/user/password","method":"PUT"}',
    });
    expect(records[0].rawContext).toBe(fetchError);
    expect(records[0].remote).toBe(true);

    expect(records[1].message).toBe('API call error');
    expect(records[1].context).toEqual({
      status: '400',
      statusText: 'Bad Request',
      traceId: 'trace-1',
      config: '{"url":"/api/user/password","method":"PUT"}',
    });

    expect(records[2].message).toBe('API call error');
    expect(records[2].context).toEqual({
      args: '{"status":400,"statusText":"Bad Request","traceId":"trace-1","config":{"url":"/api/user/password","method":"PUT"}} {"requestId":"req-1"}',
    });

    expect(records[3].context).toEqual({
      status: '400',
      statusText: 'Bad Request',
      traceId: 'trace-1',
      config: '{"url":"https://example.com/api/user/password","method":"PUT"}',
    });
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
