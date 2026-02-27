import { getBuiltInThemes, getThemeById } from './registry';

describe('theme registry', () => {
  it('includes the 90s theme as a built-in theme', () => {
    const theme = getThemeById('nineties');

    expect(theme.name).toBe('90s Neon');
    expect(theme.isDark).toBe(true);
  });

  it('exposes the 90s theme without experimental gating', () => {
    const themes = getBuiltInThemes([]);
    const nineties = themes.find((theme) => theme.id === 'nineties');

    expect(nineties).toBeDefined();
    expect(nineties?.isExtra).toBeUndefined();
  });

  it('still gates optional extra themes unless explicitly allowed', () => {
    const themes = getBuiltInThemes([]);
    const withSynthwave = getBuiltInThemes(['synthwave']);

    expect(themes.some((theme) => theme.id === 'synthwave')).toBe(false);
    expect(withSynthwave.some((theme) => theme.id === 'synthwave')).toBe(true);
  });
});
