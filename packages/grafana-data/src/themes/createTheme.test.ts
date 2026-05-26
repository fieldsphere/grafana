import beach from './themeDefinitions/beach.json';
import { createTheme, NewThemeOptionsSchema } from './createTheme';

describe('createTheme', () => {
  it('loads beach theme definition from JSON', () => {
    const parsed = NewThemeOptionsSchema.safeParse(beach);
    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }
    const theme = createTheme(parsed.data);
    expect(theme.isLight).toBe(true);
    expect(theme.name).toBe('Beach');
    expect(theme.colors.background.canvas).toBe('#efe6d9');
  });

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
});
