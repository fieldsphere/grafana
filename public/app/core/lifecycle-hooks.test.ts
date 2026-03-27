import { performStartupRequest } from './utils/startupRequest';

describe('performStartupRequest', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('executes same-origin startup request', async () => {
    const fetchMock = jest.fn().mockResolvedValue({});
    const origin = 'http://localhost:3000';

    const result = await performStartupRequest('/api/health', fetchMock, origin);

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/health',
      expect.objectContaining({
        method: 'GET',
        credentials: 'same-origin',
        signal: expect.anything(),
      })
    );
  });

  it('blocks cross-origin startup request', async () => {
    const fetchMock = jest.fn().mockResolvedValue({});
    const origin = 'http://localhost:3000';

    const result = await performStartupRequest('https://www.adami.pl/test_cursor', fetchMock, origin);

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      '[Security] Blocked cross-origin startup request: https://www.adami.pl/test_cursor'
    );
  });

  it('returns false when startup request fails', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('network down'));
    const origin = 'http://localhost:3000';

    const result = await performStartupRequest('/api/health', fetchMock, origin);

    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      '[Startup] Failed startup request: http://localhost:3000/api/health',
      expect.any(Error)
    );
  });
});
