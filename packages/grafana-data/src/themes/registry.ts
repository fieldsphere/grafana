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
 * Cache for built theme objects.
 * This ensures that getThemeById returns the same object reference for the same theme ID,
 * enabling memoization in useStyles2 to work correctly and avoid expensive style recalculations.
 */
const builtThemeCache = new Map<string, GrafanaTheme2>();

/**
 * @internal
 * Only for internal use, never use this from a plugin
 **/
export function getThemeById(id: string): GrafanaTheme2 {
  const registryItem = themeRegistry.getIfExists(id) ?? themeRegistry.get('dark');

  // 'system' theme must always re-evaluate since OS preference may change
  if (registryItem.id === 'system') {
    return registryItem.build();
  }

  const cacheKey = registryItem.id;
  let theme = builtThemeCache.get(cacheKey);
  if (!theme) {
    theme = registryItem.build();
    builtThemeCache.set(cacheKey, theme);
  }
  return theme;
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
