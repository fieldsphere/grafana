import { createStructuredLogger } from './structuredLogger';

describe('createStructuredLogger', () => {
  const originalConsole = globalThis.console;

  afterEach(() => {
    globalThis.console = originalConsole;
  });

  it('writes structured entries with source, level, message, and args', () => {
    const error = jest.fn();
    globalThis.console = { ...originalConsole, error };

    const logger = createStructuredLogger('test.source');
    logger.error('Something failed', { id: 'abc' });

    expect(error).toHaveBeenCalledWith({
      args: ['Something failed', { id: 'abc' }],
      level: 'error',
      message: 'Something failed',
      source: 'test.source',
    });
  });

  it('uses error messages when the first argument is an Error', () => {
    const warn = jest.fn();
    globalThis.console = { ...originalConsole, warn };

    const logger = createStructuredLogger('test.source');
    logger.warn(new Error('Invalid state'));

    expect(warn).toHaveBeenCalledWith({
      args: [new Error('Invalid state')],
      level: 'warn',
      message: 'Invalid state',
      source: 'test.source',
    });
  });
});
