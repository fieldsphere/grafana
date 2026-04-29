import { createTheme } from './createTheme';
import { getBuiltInThemes, getThemeById } from './registry';

describe('createTheme', () => {
  it('create custom theme', () => {
    const custom = createTheme({
      colors: {
        mode: 'dark',
        primary: {
          main: 'rgb(240,0,0)',
        },
        background: {
          canvas: '#123',
        },
      },
    });

    expect(custom.colors.primary.main).toBe('rgb(240,0,0)');
    expect(custom.colors.primary.shade).toBe('rgb(242, 38, 38)');
    expect(custom.colors.background.canvas).toBe('#123');
  });

  it('create default theme', () => {
    const theme = createTheme();
    expect(theme.colors.mode).toBe('dark');
  });

  it('creates the amethyst theme', () => {
    const theme = getThemeById('amethyst');

    expect(theme.name).toBe('Amethyst');
    expect(theme.colors.mode).toBe('dark');
    expect(theme.colors.primary.main).toBe('#A855F7');
    expect(theme.colors.background.canvas).toBe('#140F1F');
  });

  it('includes amethyst in built-in selectable themes', () => {
    expect(getBuiltInThemes([]).map((theme) => theme.id)).toEqual(['amethyst', 'dark', 'light', 'system']);
  });
});
