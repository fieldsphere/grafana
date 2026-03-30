import { ThemeColors } from './createColors';

/** @beta */
export interface ThemeShadows {
  z1: string;
  z2: string;
  z3: string;
}

/** @alpha */
export function createShadows(colors: ThemeColors): ThemeShadows {
  if (colors.mode === 'dark') {
    return {
      z1: '0px 1px 0px rgba(0, 255, 255, 0.35), 0px 2px 4px rgba(255, 0, 255, 0.2)',
      z2: '0px 2px 0px rgba(0, 255, 255, 0.3), 0px 4px 12px rgba(0, 0, 40, 0.9)',
      z3: '0px 0px 16px rgba(255, 0, 255, 0.35), 0px 8px 24px rgba(0, 0, 60, 0.95)',
    };
  }

  return {
    z1: '1px 1px 0px #ffffff, 2px 2px 0px #808080',
    z2: '2px 2px 0px #c0c0c0, 4px 4px 8px rgba(0, 0, 0, 0.15)',
    z3: 'inset 1px 1px 0px #ffffff, 2px 2px 0px #000000, 6px 6px 12px rgba(0, 0, 0, 0.2)',
  };
}
