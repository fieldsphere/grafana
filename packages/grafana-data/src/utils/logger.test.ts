import { createStructuredLogger } from './logger';

describe('createStructuredLogger', () => {
  it('writes structured log entries with source, level, message, and context', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    const logger = createStructuredLogger('test/source');

    logger.warn('Something happened', { id: 'abc' });

    expect(warn).toHaveBeenCalledWith({
      level: 'warn',
      message: 'Something happened',
      source: 'test/source',
      context: [{ id: 'abc' }],
    });

    warn.mockRestore();
  });
});
