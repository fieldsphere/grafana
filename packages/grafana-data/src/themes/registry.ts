import { Registry, RegistryItem } from '../utils/Registry';

import { createTheme, NewThemeOptionsSchema } from './createTheme';
import aubergine from './themeDefinitions/aubergine.json';
import debug from './themeDefinitions/debug.json';
import desertbloom from './themeDefinitions/desertbloom.json';
import gildedgrove from './themeDefinitions/gildedgrove.json';
import gloom from './themeDefinitions/gloom.json';
import mars from './themeDefinitions/mars.json';
import matrix from './themeDefinitions/matrix.json';
import sapphiredusk from './themeDefinitions/sapphiredusk.json';
import synthwave from './themeDefinitions/synthwave.json';
import tron from './themeDefinitions/tron.json';
import victorian from './themeDefinitions/victorian.json';
import zen from './themeDefinitions/zen.json';
import { GrafanaTheme2 } from './types';

export interface ThemeRegistryItem extends RegistryItem {
  isExtra?: boolean;
  build: () => GrafanaTheme2;
}

const ninetiesTheme = {
  name: '90s Neon',
  colors: {
    mode: 'dark',
    border: {
      weak: 'rgba(0, 255, 255, 0.2)',
      medium: 'rgba(255, 0, 255, 0.28)',
      strong: 'rgba(255, 255, 0, 0.35)',
    },
    text: {
      primary: '#F9F7FF',
      secondary: 'rgba(249, 247, 255, 0.78)',
      disabled: 'rgba(249, 247, 255, 0.55)',
      link: '#00FFFF',
      maxContrast: '#FFFFFF',
    },
    primary: {
      main: '#FF00FF',
    },
    secondary: {
      main: '#25003F',
      text: '#F9F7FF',
      border: 'rgba(0, 255, 255, 0.22)',
    },
    background: {
      canvas: '#10001C',
      primary: '#16002B',
      secondary: '#220047',
      elevated: '#220047',
    },
    action: {
      hover: 'rgba(0, 255, 255, 0.16)',
      selected: 'rgba(255, 0, 255, 0.14)',
      selectedBorder: '#00FFFF',
      focus: 'rgba(255, 255, 0, 0.18)',
      hoverOpacity: 0.1,
      disabledText: 'rgba(249, 247, 255, 0.5)',
      disabledBackground: 'rgba(0, 255, 255, 0.08)',
      disabledOpacity: 0.38,
    },
    gradients: {
      brandHorizontal: 'linear-gradient(90deg, #FF00FF 0%, #00FFFF 45%, #FFE600 100%)',
      brandVertical: 'linear-gradient(0deg, #FF00FF 0%, #00FFFF 45%, #FFE600 100%)',
    },
    contrastThreshold: 3,
    hoverFactor: 0.04,
    tonalOffset: 0.2,
  },
  shape: {
    borderRadius: 2,
  },
  typography: {
    fontFamily: "'Comic Sans MS', 'Trebuchet MS', sans-serif",
    fontFamilyMonospace: "'Courier New', monospace",
  },
} as const;

const extraThemes: { [key: string]: unknown } = {
  aubergine,
  debug,
  desertbloom,
  gildedgrove,
  gloom,
  mars,
  matrix,
  sapphiredusk,
  synthwave,
  tron,
  victorian,
  zen,
};

/**
 * @internal
 * Only for internal use, never use this from a plugin
 **/
export function getThemeById(id: string): GrafanaTheme2 {
  const theme = themeRegistry.getIfExists(id) ?? themeRegistry.get('dark');
  return theme.build();
}

/**
 * @internal
 * For internal use only
 */
export function getBuiltInThemes(allowedExtras: string[]) {
  const themes = themeRegistry.list().filter((item) => {
    if (item.isExtra) {
      return allowedExtras.includes(item.id);
    }
    return true;
  });
  // sort themes alphabetically, but put built-in themes (default, dark, light, system) first
  const sortedThemes = themes.sort((a, b) => {
    if (a.isExtra && !b.isExtra) {
      return 1;
    } else if (!a.isExtra && b.isExtra) {
      return -1;
    } else {
      return a.name.localeCompare(b.name);
    }
  });
  return sortedThemes;
}

const themeRegistry = new Registry<ThemeRegistryItem>(() => {
  return [
    { id: 'system', name: 'System preference', build: getSystemPreferenceTheme },
    { id: 'dark', name: 'Dark', build: () => createTheme({ colors: { mode: 'dark' } }) },
    { id: 'light', name: 'Light', build: () => createTheme({ colors: { mode: 'light' } }) },
    { id: 'nineties', name: ninetiesTheme.name, build: () => createTheme(ninetiesTheme) },
  ];
});

for (const [name, json] of Object.entries(extraThemes)) {
  const result = NewThemeOptionsSchema.safeParse(json);
  if (!result.success) {
    console.error(`Invalid theme definition for theme ${name}: ${result.error.message}`);
  } else {
    const theme = result.data;
    themeRegistry.register({
      id: theme.id,
      name: theme.name,
      build: () => createTheme(theme),
      isExtra: true,
    });
  }
}

function getSystemPreferenceTheme() {
  const mediaResult = window.matchMedia('(prefers-color-scheme: dark)');
  const id = mediaResult.matches ? 'dark' : 'light';
  return getThemeById(id);
}
