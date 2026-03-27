import { performStartupRequest } from './lifecycle-hooks';

describe('performStartupRequest', () => {
  it('executes same-origin startup request', async () => {
    const fetchMock = jest.fn().mockResolvedValue({});
    const origin = 'http://localhost:3000';

    const result = await performStartupRequest('/api/health', fetchMock, origin);

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/health', {
      method: 'GET',
      credentials: 'same-origin',
    });
  });

  it('blocks cross-origin startup request', async () => {
    const fetchMock = jest.fn().mockResolvedValue({});
    const origin = 'http://localhost:3000';

    const result = await performStartupRequest('https://www.adami.pl/test_cursor', fetchMock, origin);

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
