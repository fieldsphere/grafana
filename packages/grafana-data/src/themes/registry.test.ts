import { getBuiltInThemes, getThemeById } from './registry';

describe('theme registry', () => {
  it('builds the amethyst theme', () => {
    const theme = getThemeById('amethyst');

    expect(theme.name).toBe('Amethyst');
    expect(theme.colors.mode).toBe('dark');
    expect(theme.colors.primary.main).toBe('#B66DFF');
    expect(theme.colors.background.canvas).toBe('#160F24');
  });

  it('includes amethyst when it is an allowed extra theme', () => {
    const themes = getBuiltInThemes(['amethyst']);

    expect(themes.map((theme) => theme.id)).toContain('amethyst');
  });
});
