import { createStructuredLogger, setStructuredLogSink, type StructuredLogRecord } from './structuredLogger';

describe('createStructuredLogger', () => {
  afterEach(() => {
    setStructuredLogSink(undefined);
  });

  it('emits structured records to the configured sink', () => {
    const records: StructuredLogRecord[] = [];

    setStructuredLogSink((record) => records.push(record));

    createStructuredLogger('test-source').info('message', { id: 1 });

    expect(records).toEqual([
      {
        level: 'info',
        source: 'test-source',
        message: 'message',
        context: { args: [{ id: 1 }] },
      },
    ]);
  });

  it('uses non-string first arguments as context values', () => {
    const records: StructuredLogRecord[] = [];

    setStructuredLogSink((record) => records.push(record));

    createStructuredLogger('test-source').error(new Error('broken'));

    expect(records[0]).toMatchObject({
      level: 'error',
      source: 'test-source',
      message: 'test-source',
    });
    expect(records[0].context?.value).toBeInstanceOf(Error);
    expect(records[0].context?.value).toHaveProperty('message', 'broken');
  });

  it('does not throw when no sink is configured', () => {
    expect(() => createStructuredLogger('test-source').info('message')).not.toThrow();
  });
});
