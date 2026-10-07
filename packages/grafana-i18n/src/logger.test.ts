import { logger } from './logger';

describe('i18n logger', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('writes warnings with a source field', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();

    logger.warn('t() was called before i18n was initialized');

    expect(warn).toHaveBeenCalledWith('t() was called before i18n was initialized', { source: 'grafana/i18n' });
  });

  it('writes errors with a source field and the original error', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const err = new Error('load failed');

    logger.error('Error loading resources', err);

    expect(errorSpy).toHaveBeenCalledWith('Error loading resources', { source: 'grafana/i18n' }, err);
  });
});
