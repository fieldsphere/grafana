import { enableStructuredConsoleLogging } from './structuredConsole';

type ConsoleLevel = 'log' | 'info' | 'debug' | 'warn' | 'error';

type MockConsoleMethod = jest.Mock<void, [unknown]>;

interface MockConsole {
  log: MockConsoleMethod;
  info: MockConsoleMethod;
  debug: MockConsoleMethod;
  warn: MockConsoleMethod;
  error: MockConsoleMethod;
}

function createMockConsole(): MockConsole {
  return {
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function readEntry(mockConsole: MockConsole, level: ConsoleLevel): Record<string, unknown> {
  const call = mockConsole[level].mock.calls[0];
  return call[0] as Record<string, unknown>;
}

describe('enableStructuredConsoleLogging', () => {
  it('emits structured payloads for every console level', () => {
    const mockConsole = createMockConsole() as unknown as Console;

    enableStructuredConsoleLogging(mockConsole);

    mockConsole.log('hello', { id: 1 });
    mockConsole.info('info-message');
    mockConsole.debug('debug-message');
    mockConsole.warn('warn-message');
    mockConsole.error('error-message');

    for (const level of ['log', 'info', 'debug', 'warn', 'error'] as const) {
      const entry = readEntry(mockConsole as unknown as MockConsole, level);
      expect(entry.logger).toBe('grafana.frontend.console');
      expect(entry.level).toBe(level);
      expect(typeof entry.timestamp).toBe('string');
      expect(Array.isArray(entry.args)).toBe(true);
    }

    const logEntry = readEntry(mockConsole as unknown as MockConsole, 'log');
    expect(logEntry.message).toBe('hello');
    expect(logEntry.args).toEqual(['hello', { id: 1 }]);
  });

  it('serializes errors in args and avoids repatching', () => {
    const mockConsole = createMockConsole() as unknown as Console;

    enableStructuredConsoleLogging(mockConsole);
    enableStructuredConsoleLogging(mockConsole);

    const err = new Error('boom');
    mockConsole.error(err);

    const entry = readEntry(mockConsole as unknown as MockConsole, 'error');
    expect(entry.message).toBe('boom');
    expect(entry.args).toEqual([
      {
        type: 'error',
        name: 'Error',
        message: 'boom',
        stack: expect.any(String),
      },
    ]);

    expect((mockConsole as unknown as MockConsole).error).toHaveBeenCalledTimes(1);
  });
});
