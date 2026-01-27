import hoistNonReactStatics from 'hoist-non-react-statics';
import memoize from 'micro-memoize';
import { useContext } from 'react';
import * as React from 'react';

import { GrafanaTheme, GrafanaTheme2, ThemeContext } from '@grafana/data';

import { Themeable, Themeable2 } from '../types/theme';

import { stylesFactory } from './stylesFactory';

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type Subtract<T, K> = Omit<T, keyof K>;

/**
 * Mock used in tests
 */
let ThemeContextMock: React.Context<GrafanaTheme2> | null = null;

// Used by useStyles()
export const memoizedStyleCreators = new WeakMap();
const stableStyleCreatorsV1 = new Set<StyleCreator>();
const stableStyleCreatorsV2 = new Set<StyleCreator>();
const styleCreatorUsageCountsV1 = new WeakMap<StyleCreator, number>();
const styleCreatorUsageCountsV2 = new WeakMap<StyleCreator, number>();
const styleCreatorArgsRegistryV1 = new Map<StyleCreator, unknown[][]>();
const styleCreatorArgsRegistryV2 = new Map<StyleCreator, unknown[][]>();
const maxStyleArgSets = 10;

type StyleCreator = (...args: unknown[]) => unknown;

/** @deprecated use withTheme2 */
/** @public */
export const withTheme = <P extends Themeable>(Component: React.ComponentType<P>) => {
  const WithTheme: React.FunctionComponent<Subtract<P, Themeable>> = (props) => {
    /**
     * If theme context is mocked, let's use it instead of the original context
     * This is used in tests when mocking theme using mockThemeContext function defined below
     */
    const ContextComponent = ThemeContextMock || ThemeContext;
    return (
      // @ts-ignore
      <ContextComponent.Consumer>{(theme) => <Component {...props} theme={theme.v1} />}</ContextComponent.Consumer>
    );
  };

  WithTheme.displayName = `WithTheme(${Component.displayName})`;
  return hoistNonReactStatics(WithTheme, Component);
};

/** @alpha */
export const withTheme2 = <P extends Themeable2>(Component: React.ComponentType<P>) => {
  const WithTheme: React.FunctionComponent<Subtract<P, Themeable2>> = (props) => {
    /**
     * If theme context is mocked, let's use it instead of the original context
     * This is used in tests when mocking theme using mockThemeContext function defined below
     */
    const ContextComponent = ThemeContextMock || ThemeContext;
    return (
      // @ts-ignore
      <ContextComponent.Consumer>{(theme) => <Component {...props} theme={theme} />}</ContextComponent.Consumer>
    );
  };

  WithTheme.displayName = `WithTheme(${Component.displayName})`;
  return hoistNonReactStatics(WithTheme, Component);
};

/** @deprecated use useTheme2 */
/** @public */
export function useTheme(): GrafanaTheme {
  return useContext(ThemeContextMock || ThemeContext).v1;
}

/** @public */
export function useTheme2(): GrafanaTheme2 {
  return useContext(ThemeContextMock || ThemeContext);
}

/**
 * Hook for using memoized styles with access to the theme.
 *
 * NOTE: For memoization to work, you need to ensure that the function
 * you pass in doesn't change, or only if it needs to. (i.e. declare
 * your style creator outside of a function component or use `useCallback()`.)
 * */
/** @deprecated use useStyles2 */
/** @public */
export function useStyles<T>(getStyles: (theme: GrafanaTheme) => T) {
  const theme = useTheme();

  let memoizedStyleCreator: typeof getStyles = memoizedStyleCreators.get(getStyles);

  if (!memoizedStyleCreator) {
    memoizedStyleCreator = stylesFactory(getStyles);
    memoizedStyleCreators.set(getStyles, memoizedStyleCreator);
  }

	registerStyleUsage(getStyles, [], styleCreatorUsageCountsV1, stableStyleCreatorsV1, styleCreatorArgsRegistryV1);

  return memoizedStyleCreator(theme);
}

/**
 * Hook for using memoized styles with access to the theme. Pass additional
 * arguments to the getStyles function as additional arguments to this hook.
 *
 * Prefer using primitive values (boolean, number, string, etc) for
 * additional arguments for better performance
 *
 * ```
 * const getStyles = (theme, isDisabled, isOdd) => {css(...)}
 * [...]
 * const styles = useStyles2(getStyles, true, Boolean(index % 2))
 * ```
 *
 * NOTE: For memoization to work, ensure that all arguments don't change
 * across renders (or only change if they need to)
 *
 * @public
 * */
export function useStyles2<T extends unknown[], CSSReturnValue>(
  getStyles: (theme: GrafanaTheme2, ...args: T) => CSSReturnValue,
  ...additionalArguments: T
): CSSReturnValue {
  const theme = useTheme2();

  // Grafana ui can be bundled and used in older versions of Grafana where the theme doesn't have elevated background
  // This can be removed post G12
  if (!theme.colors.background.elevated) {
    theme.colors.background.elevated =
      theme.colors.mode === 'light' ? theme.colors.background.primary : theme.colors.background.secondary;
  }

  let memoizedStyleCreator: typeof getStyles = memoizedStyleCreators.get(getStyles);

  if (!memoizedStyleCreator) {
    memoizedStyleCreator = memoize(getStyles, { maxSize: 10 }); // each getStyles function will memoize 10 different sets of props
    memoizedStyleCreators.set(getStyles, memoizedStyleCreator);
  }

	registerStyleUsage(
		getStyles,
		additionalArguments,
		styleCreatorUsageCountsV2,
		stableStyleCreatorsV2,
		styleCreatorArgsRegistryV2
	);

  return memoizedStyleCreator(theme, ...additionalArguments);
}

/**
 * Enables theme context mocking
 */
/** @public */
export const mockThemeContext = (theme: GrafanaTheme2) => {
  ThemeContextMock = React.createContext(theme);

  return () => {
    ThemeContextMock = null;
  };
};

export function warmStyleCacheForTheme(theme: GrafanaTheme2) {
	warmStyleCache(theme, stableStyleCreatorsV2, styleCreatorArgsRegistryV2);
	warmStyleCache(theme.v1, stableStyleCreatorsV1, styleCreatorArgsRegistryV1);
}

function registerStyleUsage(
	getStyles: StyleCreator,
	additionalArguments: unknown[],
	usageCounts: WeakMap<StyleCreator, number>,
	stableCreators: Set<StyleCreator>,
	argsRegistry: Map<StyleCreator, unknown[][]>
) {
	const currentCount = usageCounts.get(getStyles) ?? 0;
	const nextCount = currentCount + 1;
	usageCounts.set(getStyles, nextCount);

	if (nextCount < 2) {
		return;
	}

	if (!stableCreators.has(getStyles)) {
		stableCreators.add(getStyles);
	}

	const argsList = argsRegistry.get(getStyles) ?? [];
	if (!argsList.some((args) => areArgsEqual(args, additionalArguments))) {
		argsList.push([...additionalArguments]);
		if (argsList.length > maxStyleArgSets) {
			argsList.shift();
		}
		argsRegistry.set(getStyles, argsList);
	}
}

function warmStyleCache(
	theme: GrafanaTheme | GrafanaTheme2,
	stableCreators: Set<StyleCreator>,
	argsRegistry: Map<StyleCreator, unknown[][]>
) {
	for (const getStyles of stableCreators) {
		const memoizedStyleCreator = memoizedStyleCreators.get(getStyles);
		if (!memoizedStyleCreator) {
			continue;
		}

		const argsList = argsRegistry.get(getStyles);
		if (!argsList || argsList.length === 0) {
			memoizedStyleCreator(theme);
			continue;
		}

		for (const args of argsList) {
			memoizedStyleCreator(theme, ...args);
		}
	}
}

function areArgsEqual(left: unknown[], right: unknown[]) {
	if (left.length !== right.length) {
		return false;
	}
	return left.every((value, index) => Object.is(value, right[index]));
}
