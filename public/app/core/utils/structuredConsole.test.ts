import { enableStructuredConsoleLogging } from './structuredConsole';

type ConsoleLevel = 'log' | 'info' | 'debug' | 'warn' | 'error';

function createMockConsole() {
  const sink: Record<ConsoleLevel, unknown[]> = {
    log: [],
    info: [],
    debug: [],
    warn: [],
    error: [],
  };
  const callCounts: Record<ConsoleLevel, number> = {
    log: 0,
    info: 0,
    debug: 0,
    warn: 0,
    error: 0,
  };

  const mockConsole = {
    log: (...entries: unknown[]) => {
      callCounts.log++;
      sink.log.push(...entries);
    },
    info: (...entries: unknown[]) => {
      callCounts.info++;
      sink.info.push(...entries);
    },
    debug: (...entries: unknown[]) => {
      callCounts.debug++;
      sink.debug.push(...entries);
    },
    warn: (...entries: unknown[]) => {
      callCounts.warn++;
      sink.warn.push(...entries);
    },
    error: (...entries: unknown[]) => {
      callCounts.error++;
      sink.error.push(...entries);
    },
  };

  return {
    mockConsole,
    sink,
    callCounts,
  };
}

function readEntry(sink: Record<ConsoleLevel, unknown[]>, level: ConsoleLevel): Record<string, unknown> {
  return sink[level][0] as Record<string, unknown>;
}

describe('enableStructuredConsoleLogging', () => {
  it('emits structured payloads for every console level', () => {
    const { mockConsole, sink } = createMockConsole();

    enableStructuredConsoleLogging(mockConsole);

    mockConsole.log('hello', { id: 1 });
    mockConsole.info('info-message');
    mockConsole.debug('debug-message');
    mockConsole.warn('warn-message');
    mockConsole.error('error-message');

    for (const level of ['log', 'info', 'debug', 'warn', 'error'] as const) {
      const entry = readEntry(sink, level);
      expect(entry.logger).toBe('grafana.frontend.console');
      expect(entry.level).toBe(level);
      expect(typeof entry.timestamp).toBe('string');
      expect(Array.isArray(entry.args)).toBe(true);
    }

    const logEntry = readEntry(sink, 'log');
    expect(logEntry.message).toBe('hello');
    expect(logEntry.args).toEqual(['hello', { id: 1 }]);
    expect(logEntry.payload).toEqual(['hello', { id: 1 }]);
    expect(logEntry.original_args_count).toBe(2);
  });

  it('serializes errors in args and avoids repatching', () => {
    const { mockConsole, sink, callCounts } = createMockConsole();

    enableStructuredConsoleLogging(mockConsole);
    enableStructuredConsoleLogging(mockConsole);

    const err = new Error('boom');
    mockConsole.error(err);

    const entry = readEntry(sink, 'error');
    expect(entry.message).toBe('boom');
    expect(entry.args).toEqual([
      {
        type: 'error',
        name: 'Error',
        message: 'boom',
        stack: expect.any(String),
      },
    ]);
    expect(entry.payload).toEqual({
      type: 'error',
      name: 'Error',
      message: 'boom',
      stack: expect.any(String),
    });
    expect(entry.original_args_count).toBe(1);

    expect(callCounts.error).toBe(1);
  });
});
