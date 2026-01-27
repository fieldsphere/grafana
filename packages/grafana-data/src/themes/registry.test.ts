import { getBuiltInThemes, getThemeById } from './registry';

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

  it('reuses cached themes from registry items', () => {
    const themes = getBuiltInThemes([]);
    const darkThemeItem = themes.find((theme) => theme.id === 'dark');

    expect(darkThemeItem).toBeDefined();
    const first = darkThemeItem!.build();
    const second = darkThemeItem!.build();

    expect(second).toBe(first);
  });
});
