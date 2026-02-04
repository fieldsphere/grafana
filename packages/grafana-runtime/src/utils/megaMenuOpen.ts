import { createMonitoringLogger } from './logging';

type MegaMenuOpenHook = () => Readonly<[boolean, (open: boolean, persist?: boolean) => void]>;

const runtimeHookLogger = createMonitoringLogger('runtime.hooks');

let megaMenuOpenHook: MegaMenuOpenHook | undefined = undefined;

export const setMegaMenuOpenHook = (hook: MegaMenuOpenHook) => {
  megaMenuOpenHook = hook;
};

/**
 * Guidelines:
 * - Should only be used in very specific circumstances where the mega menu needs to be opened or closed programmatically.
 */
export const useMegaMenuOpen: MegaMenuOpenHook = () => {
  if (!megaMenuOpenHook) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('useMegaMenuOpen hook not found in @grafana/runtime');
    }
    return [false, () => runtimeHookLogger.logError(new Error('MegaMenuOpen hook not found'))];
  }

  return megaMenuOpenHook();
};
