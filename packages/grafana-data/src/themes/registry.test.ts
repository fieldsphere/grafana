import { getThemeById } from './registry';

describe('getThemeById', () => {
  it('returns the same instance for repeated lookups', () => {
    const first = getThemeById('dark');
    const second = getThemeById('dark');

    expect(second).toBe(first);
  });

  it('returns different instances for different theme ids', () => {
    const darkTheme = getThemeById('dark');
    const lightTheme = getThemeById('light');

    expect(lightTheme).not.toBe(darkTheme);
  });

  it('falls back to the canonical theme cache', () => {
    const fallbackTheme = getThemeById('unknown-theme-id');
    const darkTheme = getThemeById('dark');

    expect(fallbackTheme).toBe(darkTheme);
  });

  describe('system preference', () => {
    const originalMatchMedia = window.matchMedia;

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    function mockSystemPreference(matchesDark: boolean) {
      window.matchMedia = jest.fn().mockImplementation((query: string) => {
        return {
          matches: matchesDark,
          media: query,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
          onchange: null,
          dispatchEvent: jest.fn(),
        } as MediaQueryList;
      }) as unknown as typeof window.matchMedia;
    }

    it('reflects the current system preference on each call', () => {
      mockSystemPreference(true);
      const systemDark = getThemeById('system');
      const expectedDark = getThemeById('dark');

      mockSystemPreference(false);
      const systemLight = getThemeById('system');
      const expectedLight = getThemeById('light');

      expect(systemDark).toBe(expectedDark);
      expect(systemLight).toBe(expectedLight);
      expect(systemLight).not.toBe(systemDark);
    });
  });
});
