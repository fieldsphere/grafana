import { getBuiltInThemes, getThemeById } from './registry';

describe('theme registry', () => {
  it('builds the amethyst theme', () => {
    const theme = getThemeById('amethyst');

    expect(theme.name).toBe('Amethyst');
    expect(theme.colors.mode).toBe('dark');
    expect(theme.colors.primary.main).toBe('#9B5CFF');
    expect(theme.colors.background.canvas).toBe('#17111F');
  });

  it('lists amethyst when it is an allowed extra theme', () => {
    const themes = getBuiltInThemes(['amethyst']);

    expect(themes.map((theme) => theme.id)).toContain('amethyst');
  });
});
