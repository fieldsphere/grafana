/** @beta */
export interface ThemeBreakpointValues {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

/** @beta */
export type ThemeBreakpointsKey = keyof ThemeBreakpointValues;

/** @beta */
export interface ThemeBreakpoints {
  values: ThemeBreakpointValues;
  keys: string[];
  unit: string;
  up: (key: ThemeBreakpointsKey | number) => string;
  down: (key: ThemeBreakpointsKey | number) => string;
  between: (start: ThemeBreakpointsKey | number, end: ThemeBreakpointsKey | number) => string;
  only: (key: ThemeBreakpointsKey | number) => string;
  container: {
    up: (key: ThemeBreakpointsKey | number, name?: string) => string;
    down: (key: ThemeBreakpointsKey | number, name?: string) => string;
    between: (start: ThemeBreakpointsKey | number, end: ThemeBreakpointsKey | number, name?: string) => string;
    only: (key: ThemeBreakpointsKey | number, name?: string) => string;
  };
}

/** @internal */
export function createBreakpoints(): ThemeBreakpoints {
  const step = 5;
  const keys = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const unit = 'px';
  const values: ThemeBreakpointValues = {
    xs: 0,
    sm: 544,
    md: 769, // 1 more than regular ipad in portrait
    lg: 992,
    xl: 1200,
    xxl: 1440,
  };

  function up(key: ThemeBreakpointsKey | number) {
    const value = typeof key === 'number' ? key : values[key];
    return `@media (min-width:${value}${unit})`;
  }

  function down(key: ThemeBreakpointsKey | number) {
    const value = typeof key === 'number' ? key : values[key];
    return `@media (max-width:${value - step / 100}${unit})`;
  }

  function between(start: ThemeBreakpointsKey | number, end: ThemeBreakpointsKey | number) {
    const startValue = typeof start === 'number' ? start : values[start];
    const endValue = typeof end === 'number' ? end : values[end];
    return `@media (min-width:${startValue}${unit}) and (max-width:${endValue - step / 100}${unit})`;
  }

  function only(key: ThemeBreakpointsKey | number) {
    if (typeof key === 'number') {
      return up(key);
    }

    const keyIndex = keys.indexOf(key);
    const nextKey = keys[keyIndex + 1] as ThemeBreakpointsKey | undefined;
    return nextKey ? between(key, nextKey) : up(key);
  }

  function containerUp(key: ThemeBreakpointsKey | number, name?: string) {
    const value = typeof key === 'number' ? key : values[key];
    const query = typeof name === 'string' ? `@container ${name}` : '@container';
    return `${query} (width >= ${value}${unit})`;
  }

  function containerDown(key: ThemeBreakpointsKey | number, name?: string) {
    const value = typeof key === 'number' ? key : values[key];
    const query = typeof name === 'string' ? `@container ${name}` : '@container';
    return `${query} (width < ${value}${unit})`;
  }

  function containerBetween(start: ThemeBreakpointsKey | number, end: ThemeBreakpointsKey | number, name?: string) {
    const startValue = typeof start === 'number' ? start : values[start];
    const endValue = typeof end === 'number' ? end : values[end];
    const query = typeof name === 'string' ? `@container ${name}` : '@container';
    return `${query} (width >= ${startValue}${unit}) and (width < ${endValue}${unit})`;
  }

  function containerOnly(key: ThemeBreakpointsKey | number, name?: string) {
    if (typeof key === 'number') {
      return containerUp(key, name);
    }

    const keyIndex = keys.indexOf(key);
    const nextKey = keys[keyIndex + 1] as ThemeBreakpointsKey | undefined;
    return nextKey ? containerBetween(key, nextKey, name) : containerUp(key, name);
  }

  return {
    values,
    up,
    down,
    between,
    only,
    keys,
    unit,
    container: {
      up: containerUp,
      down: containerDown,
      between: containerBetween,
      only: containerOnly,
    },
  };
}
